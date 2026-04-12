export type Comparator<K> = (a: K, b: K) => number;

export class AVLNode<K, V> {
  public key: K;
  public values: Set<V>;
  public height: number;
  public left: AVLNode<K, V> | null = null;
  public right: AVLNode<K, V> | null = null;

  constructor(key: K, value: V) {
    this.key = key;
    this.values = new Set([value]);
    this.height = 1;
  }
}

export class AVLTree<K, V> {
  public root: AVLNode<K, V> | null = null;
  private readonly compare: Comparator<K>;

  constructor(compare: Comparator<K>) {
    this.compare = compare;
  }

  private getHeight(node: AVLNode<K, V> | null): number {
    return node ? node.height : 0;
  }

  private getBalance(node: AVLNode<K, V> | null): number {
    return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
  }

  private updateHeight(node: AVLNode<K, V>): void {
    node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
  }

  private rotateRight(y: AVLNode<K, V>): AVLNode<K, V> {
    const x = y.left!;
    const T2 = x.right;

    x.right = y;
    y.left = T2;

    this.updateHeight(y);
    this.updateHeight(x);

    return x;
  }

  private rotateLeft(x: AVLNode<K, V>): AVLNode<K, V> {
    const y = x.right!;
    const T2 = y.left;

    y.left = x;
    x.right = T2;

    this.updateHeight(x);
    this.updateHeight(y);

    return y;
  }

  public insert(key: K, value: V): void {
    this.root = this.insertNode(this.root, key, value);
  }

  private insertNode(node: AVLNode<K, V> | null, key: K, value: V): AVLNode<K, V> {
    if (!node) {
      return new AVLNode(key, value);
    }

    const cmp = this.compare(key, node.key);

    if (cmp < 0) {
      node.left = this.insertNode(node.left, key, value);
    } else if (cmp > 0) {
      node.right = this.insertNode(node.right, key, value);
    } else {
      // Key is equal, add value to the set
      node.values.add(value);
      return node;
    }

    this.updateHeight(node);

    const balance = this.getBalance(node);

    // Left Left Case
    if (balance > 1 && this.compare(key, node.left!.key) < 0) {
      return this.rotateRight(node);
    }

    // Right Right Case
    if (balance < -1 && this.compare(key, node.right!.key) > 0) {
      return this.rotateLeft(node);
    }

    // Left Right Case
    if (balance > 1 && this.compare(key, node.left!.key) > 0) {
      node.left = this.rotateLeft(node.left!);
      return this.rotateRight(node);
    }

    // Right Left Case
    if (balance < -1 && this.compare(key, node.right!.key) < 0) {
      node.right = this.rotateRight(node.right!);
      return this.rotateLeft(node);
    }

    return node;
  }

  public search(key: K): Set<V> {
    const node = this.searchNode(this.root, key);
    return node ? node.values : new Set<V>();
  }

  private searchNode(node: AVLNode<K, V> | null, key: K): AVLNode<K, V> | null {
    if (!node) {
      return null;
    }

    const cmp = this.compare(key, node.key);

    if (cmp < 0) {
      return this.searchNode(node.left, key);
    } else if (cmp > 0) {
      return this.searchNode(node.right, key);
    }

    return node;
  }

  public remove(key: K, value: V): void {
    this.root = this.removeNode(this.root, key, value);
  }

  private getMinValueNode(node: AVLNode<K, V>): AVLNode<K, V> {
    let current = node;
    while (current.left) {
      current = current.left;
    }
    return current;
  }

  private removeNode(node: AVLNode<K, V> | null, key: K, value: V): AVLNode<K, V> | null {
    if (!node) {
      return null;
    }

    const cmp = this.compare(key, node.key);

    if (cmp < 0) {
      node.left = this.removeNode(node.left, key, value);
    } else if (cmp > 0) {
      node.right = this.removeNode(node.right, key, value);
    } else {
      // Key matches
      node.values.delete(value);
      if (node.values.size > 0) {
        // Still has values, node remains
        return node;
      }

      // No values left, delete node
      if (!node.left || !node.right) {
        const temp = node.left ? node.left : node.right;

        if (!temp) {
          // No child
          return null;
        } else {
          // One child
          return temp;
        }
      } else {
        // Two children
        const temp = this.getMinValueNode(node.right);
        node.key = temp.key;
        node.values = temp.values; // Copy the reference
        
        // We must remove the duplicated node from right subtree
        // Note: removeNode requires the specific value to remove, but here we want to remove the whole node.
        // A trick is to recursively remove all values, or just clear its Set so it gets deleted.
        // Let's implement an internal delete operation by key just for structural deletions.
        node.right = this.removeKeyNode(node.right, temp.key);
      }
    }

    if (!node) {
      return null;
    }

    this.updateHeight(node);

    const balance = this.getBalance(node);

    // Left Left Case
    if (balance > 1 && this.getBalance(node.left) >= 0) {
      return this.rotateRight(node);
    }

    // Left Right Case
    if (balance > 1 && this.getBalance(node.left) < 0) {
      node.left = this.rotateLeft(node.left!);
      return this.rotateRight(node);
    }

    // Right Right Case
    if (balance < -1 && this.getBalance(node.right) <= 0) {
      return this.rotateLeft(node);
    }

    // Right Left Case
    if (balance < -1 && this.getBalance(node.right) > 0) {
      node.right = this.rotateRight(node.right!);
      return this.rotateLeft(node);
    }

    return node;
  }

  // Helper just to remove the node entirely regardless of values (used in BST deletion with 2 children)
  private removeKeyNode(node: AVLNode<K, V> | null, key: K): AVLNode<K, V> | null {
    if (!node) return null;

    const cmp = this.compare(key, node.key);
    if (cmp < 0) {
      node.left = this.removeKeyNode(node.left, key);
    } else if (cmp > 0) {
      node.right = this.removeKeyNode(node.right, key);
    } else {
      if (!node.left || !node.right) {
        return node.left ? node.left : node.right;
      } else {
        const temp = this.getMinValueNode(node.right);
        node.key = temp.key;
        node.values = temp.values;
        node.right = this.removeKeyNode(node.right, temp.key);
      }
    }

    if (!node) return null;

    this.updateHeight(node);
    const balance = this.getBalance(node);

    if (balance > 1 && this.getBalance(node.left) >= 0) return this.rotateRight(node);
    if (balance > 1 && this.getBalance(node.left) < 0) { node.left = this.rotateLeft(node.left!); return this.rotateRight(node); }
    if (balance < -1 && this.getBalance(node.right) <= 0) return this.rotateLeft(node);
    if (balance < -1 && this.getBalance(node.right) > 0) { node.right = this.rotateRight(node.right!); return this.rotateLeft(node); }

    return node;
  }

  // Pre-order traverse to get all items smaller than a certain key
  public searchPrefix(prefix: string): Set<V> {
    const result = new Set<V>();
    this.traversePrefix(this.root, prefix.toLowerCase(), result);
    return result;
  }

  private traversePrefix(node: AVLNode<K, V> | null, prefix: string, result: Set<V>): void {
    if (!node) return;

    // Convert key to string to safely use startsWith, assuming string keys are mostly used here.
    const nodeKeyStr = String(node.key).toLowerCase();

    if (nodeKeyStr.startsWith(prefix)) {
      node.values.forEach(v => result.add(v));
      // Prexic match could extend to both left and right branches (e.g. "Wi" -> "W" is smaller, "Wj" is larger)
      // Actually, if node starts with 'wi', children starting with 'wi' can be on both sides!
      this.traversePrefix(node.left, prefix, result);
      this.traversePrefix(node.right, prefix, result);
    } else {
      // If the node string is strictly "smaller" alphabetically than the prefix,
      // all matches MUST be on the right subtree.
      if (nodeKeyStr.localeCompare(prefix) < 0) {
        this.traversePrefix(node.right, prefix, result);
      } else {
        // If node string is strictly "larger", matches MUST be on the left.
        this.traversePrefix(node.left, prefix, result);
      }
    }
  }

  public getSmallerThan(key: K): Set<V> {
    const result = new Set<V>();
    this.traverseSmallerThan(this.root, key, result);
    return result;
  }

  private traverseSmallerThan(node: AVLNode<K, V> | null, key: K, result: Set<V>): void {
    if (!node) return;

    const cmp = this.compare(node.key, key);

    // If node is smaller, add its values, and check BOTH left and right
    if (cmp < 0) {
      node.values.forEach(v => result.add(v));
      this.traverseSmallerThan(node.left, key, result);
      this.traverseSmallerThan(node.right, key, result);
    } else {
      // If node is greater or equal, only its left children can be smaller
      this.traverseSmallerThan(node.left, key, result);
    }
  }

  public clear(): void {
    this.root = null;
  }
}
