class Timeline {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.userId = data.userId || null; // User ID for ownership
    this.title = data.title || '';
    this.description = data.description || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.isFictional = data.isFictional !== undefined ? data.isFictional : false;
  }

  generateId() {
    return `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      description: this.description,
      createdAt: this.createdAt,
      isFictional: this.isFictional,
    };
  }

  static fromJSON(data) {
    return new Timeline(data);
  }
}

export default Timeline;

