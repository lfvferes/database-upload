import { getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import TransactionRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionRepository);

    const deleteResult = await transactionsRepository.delete(id);

    if (deleteResult.affected !== 1) {
      throw new AppError('Transaction cannot be deleted.');
    }
  }
}

export default DeleteTransactionService;
