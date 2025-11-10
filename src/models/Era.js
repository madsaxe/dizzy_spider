class Era {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.timelineId = data.timelineId || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.startTime = data.startTime || null; // Can be date string or fictional time
    this.endTime = data.endTime || null;
    this.order = data.order !== undefined ? data.order : 0;
  }

  generateId() {
    return `era_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      id: this.id,
      timelineId: this.timelineId,
      title: this.title,
      description: this.description,
      startTime: this.startTime,
      endTime: this.endTime,
      order: this.order,
    };
  }

  static fromJSON(data) {
    return new Era(data);
  }
}

export default Era;

