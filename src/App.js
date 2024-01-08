import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [contractAddress, setContractAddress] = useState('');
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [ethPrice, setEthPrice] = useState(null);
  const [percentageChange, setPercentageChange] = useState(null);

  const chainMapping = {
    Kroma: 'https://api.kromascan.com/api?module=account&action=balance&tag=latest&apikey=W5U8VP5HQ3F9PCU3YJI1H39JR7BJF6XX25&address=',
    Linea: 'https://api.lineascan.build/api?module=account&action=balance&tag=latest&apikey=I6D591367TT68PGT1IAYM8VD4SUD46RWE9&address='
  };

  const historicalPriceApiUrl = 'https://min-api.cryptocompare.com/data/v2/histohour?fsym=ETH&tsym=USD&api_key=06f48d3c67ee9533a351e08690d5202d2a73f15b60ca50cf492df6b5218142e0&limit=12';

  const handleInputChange = (event) => {
    setContractAddress(event.target.value);
  };

  const fetchEthPrice = async () => {
    try {
      const response = await fetch('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD&api_key=06f48d3c67ee9533a351e08690d5202d2a73f15b60ca50cf492df6b5218142e0');

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }

      const data = await response.json();
      setEthPrice(data.USD);
    } catch (error) {
      console.error('Error fetching Ethereum price:', error);
    }
  };

  const fetchHistoricalPrice = async () => {
    try {
      const response = await fetch(historicalPriceApiUrl);

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }

      const data = await response.json();
      const closeBefore12Hrs = data.Data.Data[0].close;
      const closeNow = data.Data.Data[data.Data.Data.length - 1].close;
      const percentageChangeValue = ((closeNow - closeBefore12Hrs) / closeBefore12Hrs) * 100;

      setPercentageChange(percentageChangeValue.toFixed(2));
    } catch (error) {
      console.error('Error fetching historical price data:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const updatedBalances = {};

    for (const chain in chainMapping) {
      const apiUrl = `${chainMapping[chain]}${contractAddress}`;

      try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status}`);
        }

        const data = await response.json();
        const tokenBalance = (data.result / 1e18).toFixed(3);
        const value = ethPrice !== null ? (tokenBalance * ethPrice).toFixed(3) : '';

        updatedBalances[chain] = {
          tokenBalance,
          value,
        };
      } catch (error) {
        console.error(`Error fetching data for ${chain}:`, error);
        updatedBalances[chain] = {
          tokenBalance: 'N/A',
          value: '',
        };
      }
    }

    setBalances(updatedBalances);
    setLoading(false);
  };

  const handleFetchData = async () => {
    // Trigger fetchData when the "Fetch Data" button is clicked
    try {
      await Promise.all([fetchEthPrice(), fetchHistoricalPrice()]);
      fetchData();
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    // Fetch data for the default contractAddress or any initial setup if needed
    fetchData();
  }, [ethPrice, contractAddress]);

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Enter Contract Address:
          <input type="text" value={contractAddress} onChange={handleInputChange} />
          <button onClick={handleFetchData}>Fetch Data</button>
        </p>
        {loading && <p>Loading...</p>}

        {ethPrice !== null && percentageChange !== null && !loading && Object.keys(balances).length > 0 && (
          <table className="Table">
            <thead>
              <tr>
                <th>Chain</th>
                <th>Ethereum Price (USD)</th>
                <th>Token Balance</th>
                <th>Value (USD)</th>
                <th>Percentage Change (Last 12 Hrs)</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(balances).map(chain => (
                <tr key={chain}>
                  <td>{chain}</td>
                  <td>{ethPrice}</td>
                  <td>{balances[chain].tokenBalance}</td>
                  <td>{balances[chain].value}</td>
                  <td>{percentageChange}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </header>
    </div>
  );
}

export default App;
