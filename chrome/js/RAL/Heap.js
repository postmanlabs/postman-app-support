/**
 * Simple max-heap for a priority queue.
 */
RAL.Heap = function() {
  this.items = [];
};

RAL.Heap.prototype = {

  /**
   * Gets the next priority value based on the head's priority.
   */
  getNextHighestPriority: function() {
    var priority = 1;
    if(this.items[0]) {
      priority = this.items[0].priority + 1;
    }
    return priority;
  },

  /**
   * Provides the index of the parent.
   *
   * @param {number} index The start position.
   */
  parentIndex: function(index) {
    return Math.floor(index * 0.5);
  },

  /**
   * Provides the index of the left child.
   *
   * @param {number} index The start position.
   */
  leftChildIndex: function(index) {
    return index * 2;
  },

  /**
   * Provides the index of the right child.
   *
   * @param {number} index The start position.
   */
  rightChildIndex: function(index) {
    return (index * 2) + 1;
  },

  /**
   * Gets the value from a specific position
   * in the heap.
   *
   * @param {number} index The position of the element.
   */
  get: function(index) {
    var value = null;
    if(index >= 1 && this.items[index - 1]) {
      value = this.items[index - 1];
    }
    return value;
  },

  /**
   * Sets a value in the heap.
   *
   * @param {number} index The position in the heap.
   * @param {number} value The value to set.
   */
  set: function(index, value) {
    this.items[index - 1] = value;
  },

  /**
   * Swaps two values in the heap.
   *
   * @param {number} indexA Index of the first item to be swapped.
   * @param {number} indexB Index of the second item to be swapped.
   */
  swap: function(indexA, indexB) {
    var temp = this.get(indexA);
    this.set(indexA, this.get(indexB));
    this.set(indexB, temp);
  },

  /**
   * Sends a value up heap. The item is compared
   * to its parent item. If its value is greater
   * then it's swapped and the process is repeated.
   *
   * @param {number} startIndex The start position for the operation.
   */
  upHeap: function(startIndex) {

    var startValue = null,
        parentValue = null,
        parentIndex = null,
        switched = false;

    do {
      switched = false;
      parentIndex = this.parentIndex(startIndex);
      startValue = this.get(startIndex);
      parentValue = this.get(parentIndex);
      switched = parentValue !== null &&
        startValue.priority > parentValue.priority;

      if(switched) {
        this.swap(startIndex, parentIndex);
        startIndex = parentIndex;
      }

    } while(switched);
  },

  /**
   * Sends a value down heap. The item is compared
   * to its two children item. If its value is less
   * then it's swapped with the <em>highest value child</em>
   * and the process is repeated.
   *
   * @param {number} startIndex The start position for the operation.
   */
  downHeap: function(startIndex) {

    var startValue = null,
        leftChildValue = null,
        rightChildValue = null,
        leftChildIndex = null,
        rightChildIndex = null,
        switchValue = null,
        switched = false;

    do {

      switched = false;
      leftChildIndex = this.leftChildIndex(startIndex);
      rightChildIndex = this.rightChildIndex(startIndex);

      startValue = this.get(startIndex) && this.get(startIndex).priority;
      leftChildValue = this.get(leftChildIndex) && this.get(leftChildIndex).priority;
      rightChildValue = this.get(rightChildIndex) && this.get(rightChildIndex).priority;

      if(leftChildValue === null) {
        leftChildValue = Number.NEGATIVE_INFINITY;
      }
      if(rightChildValue === null) {
        rightChildValue = Number.NEGATIVE_INFINITY;
      }

      switchValue = Math.max(leftChildValue, rightChildValue);

      if(startValue < switchValue) {

        if(rightChildValue === switchValue) {
          this.swap(startIndex, rightChildIndex);
          startIndex = rightChildIndex;
        } else {
          this.swap(startIndex, leftChildIndex);
          startIndex = leftChildIndex;
        }

        switched = true;
      }

    } while(switched);

  },

  /**
   * Adds a value to the heap. For now this is just
   * numbers but a comparator function could be used
   * for more complex comparisons.
   *
   * @param {number} value The value to be added to the heap.
   */
  add: function(value) {
    this.items.push(value);
    this.upHeap(this.items.length);
  },

  /**
   * Removes the head of the heap.
   */
  remove: function() {
    var value = null;

    if(this.items.length) {
      // swap with the last child
      // in the heap
      this.swap(1, this.items.length);

      // grab the value and truncate
      // the item array
      value = this.get(this.items.length);
      this.items.length -= 1;

      // push the swapped item
      // down the heap to wherever it needs
      // to sit
      this.downHeap(1);
    }

    return value;
  }
};
