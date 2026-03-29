type NodeRef<T> = {
  value: T;
  prev: NodeRef<T> | null;
  next: NodeRef<T> | null;
};

export class DoublyLinkedList<T> {
  private head: NodeRef<T> | null = null;
  private tail: NodeRef<T> | null = null;
  private length = 0;

  public clear(): void {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  public size(): number {
    return this.length;
  }

  public push(value: T): void {
    const node: NodeRef<T> = { value, prev: this.tail, next: null };

    if (!this.head) {
      this.head = node;
      this.tail = node;
      this.length = 1;
      return;
    }

    this.tail!.next = node;
    this.tail = node;
    this.length += 1;
  }

  public toArray(): T[] {
    const result: T[] = [];
    let current = this.head;

    while (current) {
      result.push(current.value);
      current = current.next;
    }

    return result;
  }
}
