import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function seed() {
    try {
        // Create Root Folder A
        const folderA = await pb.collection('nodes').create({
            title: 'Work',
            type: 'panel',
            style: { shape: 'square', color: '#3b82f6' }
        });
        console.log('Created Work folder:', folderA.id);

        // Create Root Folder B
        const folderB = await pb.collection('nodes').create({
            title: 'Personal',
            type: 'panel',
            style: { shape: 'circle', color: '#10b981' }
        });
        console.log('Created Personal folder:', folderB.id);

        // Child of A
        await pb.collection('nodes').create({
            title: 'Project X',
            type: 'text',
            parent: folderA.id,
            content: 'Meeting notes for Project X...',
            style: { shape: 'hexagon', color: '#ef4444' }
        });
        console.log('Created Project X note');

    } catch (e) {
        console.error('Seeding failed:', e.message);
        if (e.response) {
            console.error('Response data:', JSON.stringify(e.response, null, 2));
        }
        if (e.status === 403) {
            console.error('Hint: Make sure "create" API rule is empty (public) or you are authenticated.');
        }
    }
}

seed();
