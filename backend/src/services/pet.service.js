const AppError = require('../utils/error');
const { Pet } = require('../index');

class PetService {
  async assertPetOwnership(pet, userId, role) {
    if (role === 'admin') return;
    if (pet.owner_id !== userId) {
      throw new AppError('Not authorized to access this pet', 403);
    }
  }

  async createPet(petData, userId) {
    try {
      const newPet = await Pet.create({
        name: petData.name,
        species: petData.species,
        breed: petData.breed,
        age: petData.age,
        owner_id: userId
      });
      return newPet;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create pet', 500, { cause: error });
    }
  }

  async getPetList(userId) {
    try {
      const pets = await Pet.findAll({ where: { owner_id: userId } });
      return pets;
    } catch (error) {
      throw new AppError('Failed to retrieve pets', 500, { cause: error });
    }
  }

  async getPetById(petId, userId, role) {
    try {
      const pet = await Pet.findByPk(petId);
      if (!pet) {
        throw new AppError('Pet not found', 404);
      }
      await this.assertPetOwnership(pet, userId, role);
      return pet;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve pet', 500, { cause: error });
    }
  }

  async getPetsByUserId(targetUserId, requesterId, role) {
    try {
      if (role !== 'admin' && String(targetUserId) !== String(requesterId)) {
        throw new AppError('Not authorized to view these pets', 403);
      }

      const pets = await Pet.findAll({ where: { owner_id: targetUserId } });
      return pets;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve pets for user', 500, { cause: error });
    }
  }

  async updatePet(petId, updateData, userId, role) {
    try {
      const pet = await Pet.findByPk(petId);
      if (!pet) {
        throw new AppError('Pet not found', 404);
      }
      await this.assertPetOwnership(pet, userId, role);

      const { name, species, breed, age } = updateData;
      await pet.update({
        ...(name !== undefined && { name }),
        ...(species !== undefined && { species }),
        ...(breed !== undefined && { breed }),
        ...(age !== undefined && { age })
      });
      return pet;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update pet', 500, { cause: error });
    }
  }

  async deletePet(petId, userId, role) {
    try {
      const pet = await Pet.findByPk(petId);
      if (!pet) {
        throw new AppError('Pet not found', 404);
      }
      await this.assertPetOwnership(pet, userId, role);
      await pet.destroy();
      return { message: 'Pet deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete pet', 500, { cause: error });
    }
  }
}

module.exports = new PetService();
