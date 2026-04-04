import Fastify from 'fastify';
import { z } from 'zod';
import { CardSearchFilterSchema } from '@shared/search';
import {
	createCollection,
	getCollectionsByUser,
	getCollectionCards,
	addCardsToCollection,
	removeCardFromCollection,
	deleteCollection,
	loadTagTaxonomy,
	searchCards,
} from '@platform/db';

const app = Fastify();

app.get('/health', async () => ({ status: 'ok' }));

// --- Collections ---

const ListCollectionsQuerySchema = z.object({
	userId: z.string().min(1),
});

app.get('/collections', async (request, reply) => {
	const parsed = ListCollectionsQuerySchema.safeParse(request.query);
	if (!parsed.success) {
		return reply.status(400).send({
			error: 'Missing or invalid userId query parameter',
			details: parsed.error.issues,
		});
	}

	const result = await getCollectionsByUser(parsed.data.userId);
	if (!result.ok) {
		return reply.status(500).send({ error: result.error.message });
	}

	return result.value;
});

const CreateCollectionBodySchema = z.object({
	userId: z.string().min(1),
	name: z.string().min(1),
});

app.post('/collections', async (request, reply) => {
	const parsed = CreateCollectionBodySchema.safeParse(request.body);
	if (!parsed.success) {
		return reply.status(400).send({
			error: 'Invalid request body',
			details: parsed.error.issues,
		});
	}

	const result = await createCollection(parsed.data);
	if (!result.ok) {
		const status = result.error.kind === 'duplicate' ? 409 : 500;
		return reply.status(status).send({ error: result.error.message });
	}

	return reply.status(201).send(result.value);
});

const CollectionIdParamsSchema = z.object({
	id: z.coerce.number().int().positive(),
});

app.delete('/collections/:id', async (request, reply) => {
	const parsed = CollectionIdParamsSchema.safeParse(request.params);
	if (!parsed.success) {
		return reply.status(400).send({ error: 'Invalid collection id' });
	}

	const result = await deleteCollection(parsed.data.id);
	if (!result.ok) {
		const status = result.error.kind === 'not_found' ? 404 : 500;
		return reply.status(status).send({ error: result.error.message });
	}

	return result.value;
});

// --- Collection cards ---

app.get('/collections/:id/cards', async (request, reply) => {
	const parsed = CollectionIdParamsSchema.safeParse(request.params);
	if (!parsed.success) {
		return reply.status(400).send({ error: 'Invalid collection id' });
	}

	const result = await getCollectionCards(parsed.data.id);
	if (!result.ok) {
		const status = result.error.kind === 'not_found' ? 404 : 500;
		return reply.status(status).send({ error: result.error.message });
	}

	return { items: result.value, total: result.value.length };
});

const AddCardsBodySchema = z.object({
	entries: z.array(
		z.object({
			cardId: z.string().min(1),
			quantity: z.number().int().positive(),
			foil: z.boolean().optional(),
		}),
	).min(1),
});

app.post('/collections/:id/cards', async (request, reply) => {
	const paramsParsed = CollectionIdParamsSchema.safeParse(request.params);
	if (!paramsParsed.success) {
		return reply.status(400).send({ error: 'Invalid collection id' });
	}

	const bodyParsed = AddCardsBodySchema.safeParse(request.body);
	if (!bodyParsed.success) {
		return reply.status(400).send({
			error: 'Invalid request body',
			details: bodyParsed.error.issues,
		});
	}

	const result = await addCardsToCollection(
		paramsParsed.data.id,
		bodyParsed.data.entries,
	);
	if (!result.ok) {
		const status = result.error.kind === 'not_found' ? 404 : 500;
		return reply.status(status).send({ error: result.error.message });
	}

	return result.value;
});

const CollectionCardIdParamsSchema = z.object({
	id: z.coerce.number().int().positive(),
	cardEntryId: z.coerce.number().int().positive(),
});

app.delete('/collections/:id/cards/:cardEntryId', async (request, reply) => {
	const parsed = CollectionCardIdParamsSchema.safeParse(request.params);
	if (!parsed.success) {
		return reply.status(400).send({ error: 'Invalid parameters' });
	}

	const result = await removeCardFromCollection(parsed.data.cardEntryId);
	if (!result.ok) {
		const status = result.error.kind === 'not_found' ? 404 : 500;
		return reply.status(status).send({ error: result.error.message });
	}

	return result.value;
});

// --- Card search ---

app.post('/cards/search', async (request, reply) => {
	const parsed = CardSearchFilterSchema.safeParse(request.body);
	if (!parsed.success) {
		return reply.status(400).send({
			error: 'Invalid search filter',
			details: parsed.error.issues,
		});
	}

	const result = await searchCards(parsed.data);
	if (!result.ok) {
		const status = result.error.kind === 'invalid_filter' ? 400 : 500;
		return reply.status(status).send({ error: result.error.message });
	}

	return result.value;
});

// --- Tag taxonomy (read-only) ---

app.get('/tags', async (_request, reply) => {
	const result = await loadTagTaxonomy();
	if (!result.ok) {
		const err = result.error;
		const message =
			err.kind === 'database_error' ? err.message : `Tag error: ${err.slug}`;
		return reply.status(500).send({ error: message });
	}

	return result.value;
});

const start = async () => {
	try {
		await app.listen({ port: 3000, host: '0.0.0.0' });
		console.log('API listening on http://localhost:3000');
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
};

start();
