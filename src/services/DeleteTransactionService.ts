import { getRepository } from 'typeorm';

import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionsRepository = getRepository(Transaction);

    const deleteResult = await transactionsRepository.delete(id);

    if (deleteResult.affected !== 1) {
      throw new AppError('Transaction cannot be deleted.');
    }
  }
}

export default DeleteTransactionService;
