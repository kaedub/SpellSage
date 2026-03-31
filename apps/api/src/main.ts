import Fastify from 'fastify';
import {
	addToCollection,
	getCollection,
	removeFromCollection,
	searchCards,
} from '@platform/db';
import { CardSearchFilterSchema } from '@shared/search';

const app = Fastify();

app.get('/health', async () => ({ status: 'ok' }));

// View entire collection
app.get('/collection', async (request, reply) => {
	try {
		const collection = await getCollection();
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
