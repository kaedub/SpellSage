import Fastify from 'fastify';
import { z } from 'zod';
import { CardSearchFilterSchema } from '@shared/search';
import {
	addToCollection,
	getCollectionByUser,
	removeFromCollection,
	searchCards,
} from '@platform/db';

const app = Fastify();

const CollectionQuerySchema = z.object({
	userId: z.string().min(1),
});

app.get('/health', async () => ({ status: 'ok' }));

app.get('/collection', async (request, reply) => {
	const parsed = CollectionQuerySchema.safeParse(request.query);
	if (!parsed.success) {
		return reply.status(400).send({
			error: 'Missing or invalid userId query parameter',
			details: parsed.error.issues,
		});
	}

	try {
		const collection = await getCollectionByUser(parsed.data.userId);
		return collection;
	} catch (err) {
		return reply.status(500).send({ error: 'Failed to fetch collection' });
	}
});

// Add a batch of cards to collection
app.post('/collection/batch', async (request, reply) => {
	try {
		const body = request.body as Array<{ userId: string; cardName: string; set: string; quantity: number }>;
		const result = await addToCollection(body);
		return result;
	} catch (err) {
		return reply.status(400).send({ error: err instanceof Error ? err.message : 'Failed to add cards' });
	}
});

// Remove a card from collection
app.delete('/collection', async (request, reply) => {
	try {
		const { id, userId } = request.body as { id: number; userId: string };
		const result = await removeFromCollection({ id, userId });
		return result;
	} catch (err) {
		return reply.status(400).send({ error: err instanceof Error ? err.message : 'Failed to remove card' });
	}
});

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
