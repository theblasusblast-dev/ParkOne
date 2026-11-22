import { Router } from 'express';
import { errorResponses } from '../../../../infrastructure/openapi/common-schemas';
import { openApiRegistry } from '../../../../infrastructure/openapi/registry';
import { TAGS } from '../../../../infrastructure/openapi/tags';
import { z } from '../../../../shared/zod';
import { currentUserOf, type AuthGuards } from '../../../auth/infrastructure/http/auth.guards';
import type { CreateSiteUseCase } from '../../application/create-site.use-case';
import type { GetSiteUseCase } from '../../application/get-site.use-case';
import type { ListSitesUseCase } from '../../application/list-sites.use-case';
import { CreateSiteRequestSchema, SiteIdParamsSchema, SiteSchema } from './sites.schemas';

const json = (schema: z.ZodType) => ({ 'application/json': { schema } });

openApiRegistry.registerPath({
  method: 'post',
  path: '/api/sites',
  tags: [TAGS.sites.name],
  summary: 'Crear sede',
  description:
    'Crea una sede con sus espacios de carro (C-01…) y de moto (M-01…), todos libres, ' +
    'las franjas por defecto (06:00 diurna, 18:00 nocturna) y las tarifas iniciales. ' +
    'Solo administrador.',
  security: [{ bearerAuth: [] }],
  request: { body: { content: json(CreateSiteRequestSchema) } },
  responses: {
    201: { description: 'Sede creada.', content: json(SiteSchema) },
    ...errorResponses({
      400: 'Datos inválidos (VALIDATION_ERROR) o sede sin ningún espacio (SITE_WITHOUT_SPOTS).',
      401: 'Sin sesión (AUTH_REQUIRED) o sesión inválida.',
      403: 'El usuario no es administrador (FORBIDDEN).',
      409: 'Ya existe una sede con ese nombre (SITE_NAME_TAKEN).',
    }),
  },
});

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/sites',
  tags: [TAGS.sites.name],
  summary: 'Listar sedes',
  description: 'Lista todas las sedes con su capacidad y ocupación por tipo de vehículo. Solo administrador.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Sedes registradas.', content: json(z.array(SiteSchema)) },
    ...errorResponses({
      401: 'Sin sesión (AUTH_REQUIRED) o sesión inválida.',
      403: 'El usuario no es administrador (FORBIDDEN).',
    }),
  },
});

openApiRegistry.registerPath({
  method: 'get',
  path: '/api/sites/{id}',
  tags: [TAGS.sites.name],
  summary: 'Consultar una sede',
  description: 'Devuelve una sede con su capacidad. El administrador consulta cualquiera; el empleado, solo la suya.',
  security: [{ bearerAuth: [] }],
  request: { params: SiteIdParamsSchema },
  responses: {
    200: { description: 'Datos de la sede.', content: json(SiteSchema) },
    ...errorResponses({
      400: 'El id no tiene formato UUID (VALIDATION_ERROR).',
      401: 'Sin sesión (AUTH_REQUIRED) o sesión inválida.',
      403: 'El empleado consulta una sede que no es la suya (SITE_FORBIDDEN).',
      404: 'No existe la sede (SITE_NOT_FOUND).',
    }),
  },
});

export interface SitesUseCases {
  create: CreateSiteUseCase;
  list: ListSitesUseCase;
  get: GetSiteUseCase;
}

export function createSitesRouter(useCases: SitesUseCases, guards: AuthGuards): Router {
  const router = Router();

  router.post('/', guards.authenticate, guards.allow('ADMIN'), async (req, res) => {
    const input = CreateSiteRequestSchema.parse(req.body);
    const body: z.infer<typeof SiteSchema> = await useCases.create.execute(input);
    res.status(201).json(body);
  });

  router.get('/', guards.authenticate, guards.allow('ADMIN'), async (_req, res) => {
    const body: z.infer<typeof SiteSchema>[] = await useCases.list.execute();
    res.json(body);
  });

  router.get('/:id', guards.authenticate, async (req, res) => {
    const { id } = SiteIdParamsSchema.parse(req.params);
    const body: z.infer<typeof SiteSchema> = await useCases.get.execute(currentUserOf(req), id);
    res.json(body);
  });

  return router;
}
