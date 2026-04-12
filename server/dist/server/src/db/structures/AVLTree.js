"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AVLTree = exports.AVLNode = void 0;
class AVLNode {
    key;
    values;
    height;
    left = null;
    right = null;
    constructor(key, value) {
        this.key = key;
        this.values = new Set([value]);
        this.height = 1;
    }
}
exports.AVLNode = AVLNode;
class AVLTree {
    root = null;
    compare;
    constructor(compare) {
        this.compare = compare;
    }
    getHeight(node) {
        return node ? node.height : 0;
    }
    getBalance(node) {
        return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
    }
    updateHeight(node) {
        node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
    }
    rotateRight(y) {
        const x = y.left;
        const T2 = x.right;
        x.right = y;
        y.left = T2;
        this.updateHeight(y);
        this.updateHeight(x);
        return x;
    }
    rotateLeft(x) {
        const y = x.right;
        const T2 = y.left;
        y.left = x;
        x.right = T2;
        this.updateHeight(x);
        this.updateHeight(y);
        return y;
    }
    insert(key, value) {
        this.root = this.insertNode(this.root, key, value);
    }
    insertNode(node, key, value) {
        if (!node) {
            return new AVLNode(key, value);
        }
        const cmp = this.compare(key, node.key);
        if (cmp < 0) {
            node.left = this.insertNode(node.left, key, value);
        }
        else if (cmp > 0) {
            node.right = this.insertNode(node.right, key, value);
        }
        else {
            // Key is equal, add value to the set
            node.values.add(value);
            return node;
        }
        this.updateHeight(node);
        const balance = this.getBalance(node);
        // Left Left Case
        if (balance > 1 && this.compare(key, node.left.key) < 0) {
            return this.rotateRight(node);
        }
        // Right Right Case
        if (balance < -1 && this.compare(key, node.right.key) > 0) {
            return this.rotateLeft(node);
        }
        // Left Right Case
        if (balance > 1 && this.compare(key, node.left.key) > 0) {
            node.left = this.rotateLeft(node.left);
            return this.rotateRight(node);
        }
        // Right Left Case
        if (balance < -1 && this.compare(key, node.right.key) < 0) {
            node.right = this.rotateRight(node.right);
            return this.rotateLeft(node);
        }
        return node;
    }
    search(key) {
        const node = this.searchNode(this.root, key);
        return node ? node.values : new Set();
    }
    searchNode(node, key) {
        if (!node) {
            return null;
        }
        const cmp = this.compare(key, node.key);
        if (cmp < 0) {
            return this.searchNode(node.left, key);
        }
        else if (cmp > 0) {
            return this.searchNode(node.right, key);
        }
        return node;
    }
    remove(key, value) {
        this.root = this.removeNode(this.root, key, value);
    }
    getMinValueNode(node) {
        let current = node;
        while (current.left) {
            current = current.left;
        }
        return current;
    }
    removeNode(node, key, value) {
        if (!node) {
            return null;
        }
        const cmp = this.compare(key, node.key);
        if (cmp < 0) {
            node.left = this.removeNode(node.left, key, value);
        }
        else if (cmp > 0) {
            node.right = this.removeNode(node.right, key, value);
        }
        else {
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
                }
                else {
                    // One child
                    return temp;
                }
            }
            else {
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
            node.left = this.rotateLeft(node.left);
            return this.rotateRight(node);
        }
        // Right Right Case
        if (balance < -1 && this.getBalance(node.right) <= 0) {
            return this.rotateLeft(node);
        }
        // Right Left Case
        if (balance < -1 && this.getBalance(node.right) > 0) {
            node.right = this.rotateRight(node.right);
            return this.rotateLeft(node);
        }
        return node;
    }
    // Helper just to remove the node entirely regardless of values (used in BST deletion with 2 children)
    removeKeyNode(node, key) {
        if (!node)
            return null;
        const cmp = this.compare(key, node.key);
        if (cmp < 0) {
            node.left = this.removeKeyNode(node.left, key);
        }
        else if (cmp > 0) {
            node.right = this.removeKeyNode(node.right, key);
        }
        else {
            if (!node.left || !node.right) {
                return node.left ? node.left : node.right;
            }
            else {
                const temp = this.getMinValueNode(node.right);
                node.key = temp.key;
                node.values = temp.values;
                node.right = this.removeKeyNode(node.right, temp.key);
            }
        }
        if (!node)
            return null;
        this.updateHeight(node);
        const balance = this.getBalance(node);
        if (balance > 1 && this.getBalance(node.left) >= 0)
            return this.rotateRight(node);
        if (balance > 1 && this.getBalance(node.left) < 0) {
            node.left = this.rotateLeft(node.left);
            return this.rotateRight(node);
        }
        if (balance < -1 && this.getBalance(node.right) <= 0)
            return this.rotateLeft(node);
        if (balance < -1 && this.getBalance(node.right) > 0) {
            node.right = this.rotateRight(node.right);
            return this.rotateLeft(node);
        }
        return node;
    }
    // Pre-order traverse to get all items smaller than a certain key
    getSmallerThan(key) {
        const result = new Set();
        this.traverseSmallerThan(this.root, key, result);
        return result;
    }
    traverseSmallerThan(node, key, result) {
        if (!node)
            return;
        const cmp = this.compare(node.key, key);
        // If node is smaller, add its values, and check BOTH left and right
        if (cmp < 0) {
            node.values.forEach(v => result.add(v));
            this.traverseSmallerThan(node.left, key, result);
            this.traverseSmallerThan(node.right, key, result);
        }
        else {
            // If node is greater or equal, only its left children can be smaller
            this.traverseSmallerThan(node.left, key, result);
        }
    }
    clear() {
        this.root = null;
    }
}
exports.AVLTree = AVLTree;
