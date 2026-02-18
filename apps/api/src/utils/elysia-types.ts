import type { BaseMacro, LocalHook, SingletonBase } from 'elysia';
import type { PossibleResponse, RouteSchema } from 'elysia/types';

interface RouteSchemaWithResolvedMacro extends RouteSchema {
  response: PossibleResponse;
  return: PossibleResponse;
  resolve: Record<string, unknown>;
}

export type ControllerHook = LocalHook<
  BaseMacro,
  RouteSchemaWithResolvedMacro,
  SingletonBase,
  Record<string, Error>,
  string
>;

export type ExtractBody<T> = T extends { body: infer B } ? B : unknown;
