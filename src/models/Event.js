class Event {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.eraId = data.eraId || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.time = data.time || null; // Can be date string, fictional time, or null for relative positioning
    this.order = data.order !== undefined ? data.order : 0;
    this.positionRelativeTo = data.positionRelativeTo || null; // ID of event to position before/after
    this.positionType = data.positionType || null; // 'before' or 'after'
    this.imageUrl = data.imageUrl || null; // Path or URI to hero/cover image
  }

  generateId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      id: this.id,
      eraId: this.eraId,
      title: this.title,
      description: this.description,
      time: this.time,
      order: this.order,
      positionRelativeTo: this.positionRelativeTo,
      positionType: this.positionType,
      imageUrl: this.imageUrl,
    };
  }

  static fromJSON(data) {
    return new Event(data);
  }
}

export default Event;

