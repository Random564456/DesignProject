export async function fetchData(url, sendingData) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sendingData)
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`)
        }

        const data = await response.json();

        return data;

    } catch (error) {
        console.error('fetch error:', error);
        return null;
    }
}

