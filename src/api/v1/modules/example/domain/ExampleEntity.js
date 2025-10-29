/**
 * Example Domain Entity
 * Represents a business entity in the domain layer
 */
class ExampleEntity {
  constructor({ id, name, description, createdAt, updatedAt }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  update(data) {
    if (data.name) this.name = data.name;
    if (data.description) this.description = data.description;
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export default ExampleEntity;
