# Internal Read-Through Notes — Part I and Part II

## Goal
Capture evidence-based read-through findings for the introduction baseline and Chapters 4–7, using the locked title/subtitle pair and synopsis annotation grid as the control baseline.

## Status
Completed for the internal read-through review.

## Scope
- Orientation baseline:
  - `docs/internal-title-subtitle-lock.md`
  - `docs/internal-synopsis-annotation-grid.md`
  - `manuscript/sample-introduction-high-agency-ai-worker.md`
- Chapters:
  - `manuscript/sample-chapter-04-think-before-you-prompt.md`
  - `manuscript/sample-chapter-05-build-workflows-not-tricks.md`
  - `manuscript/sample-chapter-06-keep-the-human-in-the-loop-but-put-the-human-in-the-right-loop.md`
  - `manuscript/sample-chapter-07-taste-standards-and-the-fight-against-generic-output.md`

## Output contract
### Keep-strengths
1. **The intro and Part II are aligned with the locked promise.** The introduction defines high-agency as defining the problem, quality, constraints, and human-owned decisions (`sample-introduction` lines 19-25, 29-35), and Chapters 4–7 turn that into a concrete operating sequence: brief, workflow, allocation, and standards.
2. **Chapter 4 is a strong upstream chapter.** It makes the work brief the unit of control, uses a concrete support-response-time case, and makes the brief a review tool instead of a prompt trick (`sample-chapter-04` lines 54-67, 181-209, 300-347).
3. **Chapters 5–7 preserve the synopsis grid’s control ladder.** Chapter 5 adds repeatable workflow architecture and provenance (`sample-chapter-05` lines 44-50, 132-145, 227-281), Chapter 6 makes human ownership explicit with delegate/supervise/own (`sample-chapter-06` lines 46-57, 67-135, 257-302), and Chapter 7 turns standards into a cross-domain review system (`sample-chapter-07` lines 15-18, 313-323).

### Must-fix issues
1. **Priority: P1**  
   **Evidence:** Part II’s examples are still almost entirely managerial or ops-facing. The intro promises knowledge workers, managers, and creators (`sample-introduction` line 29), but Chapter 4 uses a support-response-time leadership update (`sample-chapter-04` lines 300-314), Chapter 5 centers a Friday leadership brief (`sample-chapter-05` lines 227-281), Chapter 6 uses a support-ops escalation queue (`sample-chapter-06` lines 257-302), and Chapter 7 uses a manager’s slipping-initiative brief (`sample-chapter-07` lines 277-309).  
   **Revision action:** Add at least one creator-facing or individual-contributor mini-case or side example in Part II so the operating model visibly travels beyond manager-update work.
2. **Priority: P1**  
   **Evidence:** Chapter 4’s bridge to the rest of Part II is too expansive. The “Why this chapter sits first in Part II” section enumerates writing, research, planning, and coordination in one sweep (`sample-chapter-04` lines 343-347), which risks turning the chapter into a compact summary of the whole operating model instead of a sharply bounded upstream principle.  
   **Revision action:** Compress that bridge to one short callback sentence or a small callout box, and let the later chapters carry the detailed domain mapping.
3. **Priority: P2**  
   **Evidence:** Chapter 7 explains the standards shift clearly, but the core transformation still reads more as narration than direct comparison. The weak brief and the stronger workflow are described in sequence (`sample-chapter-07` lines 281-309), yet the reader never sees a compact side-by-side artifact showing the generic version next to the sharpened version.  
   **Revision action:** Add a short before/after excerpt or a side-by-side block inside the slipping-initiative scenario so the improvement is visible at the artifact level, not just explained in prose.

### Watch items
1. **Priority: P2**  
   **Evidence:** Chapter 6’s allocation rubric is working, but it is the closest Part II gets to the planning/coordination boundary that later chapters cover. The human-owned escalation decision in the support-ops queue (`sample-chapter-06` lines 257-302) is still cleanly allocation-focused now, but future expansion could drift into decision-prep or coordination language.  
   **Revision action:** Keep future revisions of Chapter 6 anchored on allocation variables and ownership boundaries; avoid adding recommendation or coordination workflow examples there.
2. **Priority: P3**  
   **Evidence:** The title lock notes that “high-agency” may feel abstract to a cold reader, and the intro defines it once (`sample-introduction` lines 19-25). After that, Part II relies mostly on systems language, so the term can fade into the background if later chapters do not restate it plainly.  
   **Revision action:** Re-seed one or two plain-language restatements of “high-agency” in later Part II/III revisions so the term keeps feeling earned and reader-facing rather than branded shorthand.
