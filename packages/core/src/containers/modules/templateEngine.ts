import { TYPES } from '@containers';
import { ITemplateEngineOptions, TemplateProviderType } from '@models';
import {
  ErrorExtension,
  FileTemplateProvider,
  NunjucksCompilerExtension,
  ReqExtension,
  TemplateProvider,
  UniqueExtension,
  InMemoryCodeLoader,
  NunjucksCompiler,
  Compiler,
  TemplateEngine,
} from '@template-engine';
import { ContainerModule, interfaces } from 'inversify';
import { TemplateEngineOptions } from '../../options';
import * as nunjucks from 'nunjucks';

export const templateEngineModule = (options: ITemplateEngineOptions) =>
  new ContainerModule((bind) => {
    // Options
    bind<ITemplateEngineOptions>(
      TYPES.TemplateEngineInputOptions
    ).toConstantValue(options);
    bind<ITemplateEngineOptions>(TYPES.TemplateEngineOptions)
      .to(TemplateEngineOptions)
      .inSingletonScope();

    // TemplateProvider
    bind<TemplateProvider>(TYPES.TemplateProvider)
      .to(FileTemplateProvider)
      .inSingletonScope()
      .whenTargetNamed(TemplateProviderType.LocalFile);

    bind<interfaces.AutoNamedFactory<TemplateProvider>>(
      TYPES.Factory_TemplateProvider
    ).toAutoNamedFactory<TemplateProvider>(TYPES.TemplateProvider);

    // Extensions
    bind<NunjucksCompilerExtension>(TYPES.CompilerExtension)
      .to(UniqueExtension)
      .inSingletonScope();
    bind<NunjucksCompilerExtension>(TYPES.CompilerExtension)
      .to(ErrorExtension)
      .inSingletonScope();
    bind<NunjucksCompilerExtension>(TYPES.CompilerExtension)
      .to(ReqExtension)
      .inSingletonScope();

    // Loader
    bind<nunjucks.ILoader>(TYPES.CompilerLoader)
      .to(InMemoryCodeLoader)
      .inSingletonScope();

    // Compiler
    bind<Compiler>(TYPES.Compiler).to(NunjucksCompiler).inSingletonScope();

    // Template Engine
    bind<TemplateEngine>(TYPES.TemplateEngine)
      .to(TemplateEngine)
      .inSingletonScope();
  });
