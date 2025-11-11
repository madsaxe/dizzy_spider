class Scene {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.eventId = data.eventId || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.time = data.time || null; // Can be date string, fictional time, or null for relative positioning
    this.order = data.order !== undefined ? data.order : 0;
    this.positionRelativeTo = data.positionRelativeTo || null; // ID of scene to position before/after
    this.positionType = data.positionType || null; // 'before' or 'after'
    this.imageUrl = data.imageUrl || null; // Path or URI to hero/cover image
  }

  generateId() {
    return `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      id: this.id,
      eventId: this.eventId,
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
    return new Scene(data);
  }
}

export default Scene;

