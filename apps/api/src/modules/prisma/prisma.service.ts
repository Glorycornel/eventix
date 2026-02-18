import { Injectable, OnModuleInit } from '@nestjs/common';

type PrismaClientConstructor = new () => {
  $connect?: () => Promise<void>;
};

let prismaModule: { PrismaClient?: PrismaClientConstructor } = {};
try {
  prismaModule = require('@prisma/client') as {
    PrismaClient?: PrismaClientConstructor;
  };
} catch {
  prismaModule = {};
}

const PrismaClientBase: PrismaClientConstructor =
  prismaModule.PrismaClient ??
  class {
    async $connect() {
      return Promise.resolve();
    }
  };

@Injectable()
export class PrismaService extends PrismaClientBase implements OnModuleInit {
  // Fallback for environments where Prisma client delegates are not generated.
  [key: string]: any;

  async onModuleInit() {
    if (typeof this.$connect === 'function') {
      await this.$connect();
    }
  }
}
