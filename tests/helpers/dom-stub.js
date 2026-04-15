class TextNode {
  constructor(text) {
    this.nodeType = 3;
    this.textContent = String(text);
  }
}

class ElementNode {
  constructor(tagName) {
    this.nodeType = 1;
    this.tagName = tagName.toLowerCase();
    this.children = [];
    this.className = '';
    this.attributes = {};
    this.textContent = '';
    this.value = '';
  }

  append(...nodes) {
    for (const node of nodes) {
      if (node == null) continue;
      if (typeof node === 'string') {
        this.children.push(new TextNode(node));
      } else {
        this.children.push(node);
      }
    }
  }

  appendChild(node) {
    this.append(node);
    return node;
  }

  replaceChildren(...nodes) {
    this.children = [];
    this.append(...nodes);
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === 'class') this.className = String(value);
  }
}

export function createDocumentStub() {
  return {
    createElement(tagName) {
      return new ElementNode(tagName);
    },
    createDocumentFragment() {
      return new ElementNode('#fragment');
    }
  };
}

export function collectText(node) {
  if (!node) return '';
  if (node.nodeType === 3) return node.textContent;
  const own = node.value || node.textContent || '';
  return own + (node.children || []).map(collectText).join('');
}

export function findTags(node, tagName, found = []) {
  if (!node || node.nodeType === 3) return found;
  if (node.tagName === tagName.toLowerCase()) found.push(node);
  for (const child of node.children || []) {
    findTags(child, tagName, found);
  }
  return found;
}
