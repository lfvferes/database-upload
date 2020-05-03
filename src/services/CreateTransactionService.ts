import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import TransactionRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionRepository);
    const categoriesRepository = getRepository(Category);

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Invalid transaction.');
    }

    if (type === 'outcome') {
      const { total } = await transactionsRepository.getBalance();

      if (value > total) {
        throw new AppError(
          `Insufficient balance. Your current balance is ${(
            Math.round(total * 100) / 100
          ).toFixed(2)}`,
        );
      }
    }

    let categoryModel = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (!categoryModel) {
      categoryModel = categoriesRepository.create({ title: category });

      await categoriesRepository.save(categoryModel);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: categoryModel.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
