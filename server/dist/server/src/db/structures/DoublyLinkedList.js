"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoublyLinkedList = void 0;
class DoublyLinkedList {
    head = null;
    tail = null;
    length = 0;
    clear() {
        this.head = null;
        this.tail = null;
        this.length = 0;
    }
    size() {
        return this.length;
    }
    push(value) {
        const node = { value, prev: this.tail, next: null };
        if (!this.head) {
            this.head = node;
            this.tail = node;
            this.length = 1;
            return;
        }
        this.tail.next = node;
        this.tail = node;
        this.length += 1;
    }
    toArray() {
        const result = [];
        let current = this.head;
        while (current) {
            result.push(current.value);
            current = current.next;
        }
        return result;
    }
}
exports.DoublyLinkedList = DoublyLinkedList;
