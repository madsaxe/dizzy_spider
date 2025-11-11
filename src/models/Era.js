class Era {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.timelineId = data.timelineId || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.startTime = data.startTime || null; // Can be date string or fictional time
    this.endTime = data.endTime || null;
    this.order = data.order !== undefined ? data.order : 0;
    this.positionRelativeTo = data.positionRelativeTo || null; // ID of era to position after
    this.positionType = data.positionType || null; // 'after' (only option for eras)
    this.imageUrl = data.imageUrl || null; // Path or URI to hero/cover image
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
      positionRelativeTo: this.positionRelativeTo,
      positionType: this.positionType,
      imageUrl: this.imageUrl,
    };
  }

  static fromJSON(data) {
    return new Era(data);
  }
}

export default Era;

