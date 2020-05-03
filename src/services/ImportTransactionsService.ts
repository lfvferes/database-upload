import fs from 'fs';
import csvParse from 'csv-parse';
import { getRepository, In } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface CsvTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionRepository = getRepository(Transaction);
    const categoryRepository = getRepository(Category);

    const csvTransactions: CsvTransaction[] = [];
    const csvCategories: string[] = [];
    const parse = csvParse({ from_line: 2 });

    // Faz a leitura do arquivo CSV.
    await new Promise(resolve =>
      fs
        .createReadStream(filePath)
        .pipe(parse)
        .on('data', async row => {
          const [title, type, value, category] = row.map((cell: string) =>
            cell.trim(),
          );

          if (!title || !type || !value) return;

          csvTransactions.push({ title, type, value, category });

          if (category) {
            csvCategories.push(category);
          }
        })
        .on('end', resolve),
    );

    // Busca categorias existentes.
    const existentCategories = await categoryRepository.find({
      where: { title: In(csvCategories) },
    });

    // Filtra categorias CSV não existentes para adicionar no DB.
    const addCsvCategories = csvCategories
      .filter(
        csvTitle => !existentCategories.map(c => c.title).includes(csvTitle),
      )
      .filter((value, index, self) => self.indexOf(value) === index);

    // Cria categorias para adicionar no DB.
    const addCategories = categoryRepository.create(
      addCsvCategories.map(title => ({ title })),
    );

    // Persite no DB a lista de categorias.
    await categoryRepository.save(addCategories);

    // Junta todas as categorias para associar nas transações.
    const allCategories = [...existentCategories, ...addCategories];

    // Cria transações para adicionar no DB.
    const addTransactions = transactionRepository.create(
      csvTransactions.map(csvTransaction => ({
        title: csvTransaction.title,
        type: csvTransaction.type,
        value: csvTransaction.value,
        category: allCategories.find(
          category => category.title === csvTransaction.category,
        ),
      })),
    );

    // Persite no DB a lista de transações.
    await transactionRepository.save(addTransactions);

    // Retorna transações criadas.
    return addTransactions;
  }
}

export default ImportTransactionsService;
