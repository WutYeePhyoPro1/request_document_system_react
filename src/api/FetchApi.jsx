export const fetchData = async (url, token, label = '', setter = null) => {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if (setter) {
            setter(data);
        }
        return data;
    } catch (error) {
        console.error(`Error fetching ${label}:`, error);
        throw error;
    }
};





  
  

  




