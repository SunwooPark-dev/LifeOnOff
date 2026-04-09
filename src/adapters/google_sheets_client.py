from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import gspread
from gspread.utils import rowcol_to_a1

from src.config import settings


class GoogleSheetsClient:
    DEFAULT_HEADERS = [
        "id",
        "published_at",
        "source_url",
        "headline",
        "summary_draft",
        "status",
        "PRO_draft",
        "PRO_x",
        "PRO_threads",
        "PRO_linkedin",
        "PRO_instagram",
        "PRO_facebook",
        "d1",
        "d2",
        "d3",
        "d4",
        "d5",
        "d6",
        "d7",
        "total",
        "reason",
        "model_primary",
        "model_used",
        "refine_status",
        "retry_count",
        "error_code",
        "error_note",
    ]
    PLATFORM_COLUMNS = {
        "x": "PRO_x",
        "threads": "PRO_threads",
        "linkedin": "PRO_linkedin",
        "instagram": "PRO_instagram",
        "facebook": "PRO_facebook",
    }

    def __init__(self):
        cred_path = settings.GOOGLE_CREDENTIALS_PATH
        if not cred_path or not os.path.exists(cred_path):
            raise ValueError(f"Google Credentials file not found at: {cred_path}")

        self.client = gspread.service_account(filename=cred_path)
        self.spreadsheet_id = settings.SPREADSHEET_ID
        self.spreadsheet = self.client.open_by_key(self.spreadsheet_id)

        self.sheet_name = "Pipeline_Drafts"
        self.worksheet = self.get_or_create_worksheet(self.sheet_name, self.DEFAULT_HEADERS)

    def get_or_create_worksheet(self, sheet_name: str, headers: Optional[List[str]] = None):
        try:
            worksheet = self.spreadsheet.worksheet(sheet_name)
        except gspread.exceptions.WorksheetNotFound:
            worksheet = self.spreadsheet.add_worksheet(
                title=sheet_name,
                rows="1000",
                cols=str(max(len(headers or []), 20)),
            )
            if headers:
                worksheet.update("A1", [headers], value_input_option="USER_ENTERED")
        return worksheet

    def get_headers(self) -> List[str]:
        headers = self.worksheet.row_values(1)
        return headers or list(self.DEFAULT_HEADERS)

    def backup_current_worksheet(self) -> Optional[str]:
        values = self.worksheet.get_all_values()
        if not values:
            return None

        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        backup_title = f"{self.sheet_name}_backup_{timestamp}"
        rows = max(len(values) + 10, 100)
        cols = max(max(len(row) for row in values), len(self.DEFAULT_HEADERS))
        backup_ws = self.spreadsheet.add_worksheet(title=backup_title, rows=str(rows), cols=str(cols))
        end_cell = rowcol_to_a1(len(values), cols)
        padded_values = [row + [""] * (cols - len(row)) for row in values]
        backup_ws.update(f"A1:{end_cell}", padded_values, value_input_option="USER_ENTERED")
        return backup_title

    def ensure_schema(self, create_backup: bool = False) -> bool:
        values = self.worksheet.get_all_values()
        if not values:
            self.worksheet.update("A1", [self.DEFAULT_HEADERS], value_input_option="USER_ENTERED")
            return True

        current_headers = values[0]
        if current_headers == self.DEFAULT_HEADERS:
            return False

        if create_backup:
            self.backup_current_worksheet()

        normalized_rows = [self.DEFAULT_HEADERS]
        for row in values[1:]:
            row_map = {
                header: row[idx] if idx < len(row) else ""
                for idx, header in enumerate(current_headers)
            }
            normalized_rows.append([row_map.get(header, "") for header in self.DEFAULT_HEADERS])

        self.worksheet.clear()
        end_cell = rowcol_to_a1(len(normalized_rows), len(self.DEFAULT_HEADERS))
        self.worksheet.update(
            f"A1:{end_cell}",
            normalized_rows,
            value_input_option="USER_ENTERED",
        )
        return True

    def append_draft(self, row_data: list):
        padded_row = list(row_data) + [""] * (len(self.DEFAULT_HEADERS) - len(row_data))
        self.worksheet.append_row(padded_row[: len(self.DEFAULT_HEADERS)])

    def append_draft_dict(self, row_data: Dict[str, Any]):
        normalized = [row_data.get(header, "") for header in self.DEFAULT_HEADERS]
        self.worksheet.append_row(normalized, value_input_option="USER_ENTERED")

    def append_to_sheet(self, sheet_name: str, row_data: list):
        ws = self.get_or_create_worksheet(sheet_name)
        ws.append_row(row_data, value_input_option="USER_ENTERED")

    def get_all_records(self):
        self.ensure_schema(create_backup=False)
        return self.worksheet.get_all_records(default_blank="")

    def _find_row_index_by_id(self, article_id: str) -> Optional[int]:
        records = self.worksheet.get_all_records(default_blank="")
        for idx, row in enumerate(records, start=2):
            if str(row.get("id", "")).strip() == str(article_id).strip():
                return idx
        return None

    def update_fields_by_id(self, article_id: str, updates: Dict[str, Any]) -> bool:
        row_index = self._find_row_index_by_id(article_id)
        if row_index is None:
            return False

        headers = self.get_headers()
        current_row = self.worksheet.row_values(row_index)
        padded_row = current_row + [""] * (len(headers) - len(current_row))

        for field, value in updates.items():
            if field not in headers:
                continue
            padded_row[headers.index(field)] = value

        end_cell = rowcol_to_a1(row_index, len(headers))
        self.worksheet.update(
            f"A{row_index}:{end_cell}",
            [padded_row],
            value_input_option="USER_ENTERED",
        )
        return True

    def update_status_by_id(self, article_id: str, new_status: str):
        self.update_fields_by_id(article_id, {"status": new_status})

    def increment_retry_by_id(self, article_id: str, error_code: str = "", error_note: str = "") -> bool:
        records = self.get_all_records()
        current_retry = 0
        for row in records:
            if str(row.get("id", "")).strip() == str(article_id).strip():
                try:
                    current_retry = int(str(row.get("retry_count", "0") or "0"))
                except ValueError:
                    current_retry = 0
                break

        return self.update_fields_by_id(
            article_id,
            {
                "retry_count": current_retry + 1,
                "error_code": error_code,
                "error_note": error_note,
                "refine_status": "error",
            },
        )

    def update_platform_contents(
        self,
        article_id: str,
        content_x: str,
        content_threads: str,
        content_linkedin: str,
        content_instagram: str,
        content_facebook: str,
        *,
        model_primary: str = "",
        model_used: str = "",
        refine_status: str = "completed",
        error_code: str = "",
        error_note: str = "",
    ) -> bool:
        return self.update_fields_by_id(
            article_id,
            {
                "PRO_x": content_x,
                "PRO_threads": content_threads,
                "PRO_linkedin": content_linkedin,
                "PRO_instagram": content_instagram,
                "PRO_facebook": content_facebook,
                "model_primary": model_primary,
                "model_used": model_used,
                "refine_status": refine_status,
                "error_code": error_code,
                "error_note": error_note,
            },
        )
