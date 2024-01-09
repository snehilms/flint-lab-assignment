import React, { useState, useEffect } from 'react';
import Speedometer from 'react-d3-speedometer';
import './App.css';
import Loader from './Loader';

function App() {
  const [contractAddress, setContractAddress] = useState('');
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [ethPrice, setEthPrice] = useState(null);
  const [percentageChange, setPercentageChange] = useState(null);
  const [showTable, setShowTable] = useState(false);

  const chainMapping = {
    Kroma: 'https://api.kromascan.com/api?module=account&action=balance&tag=latest&apikey=W5U8VP5HQ3F9PCU3YJI1H39JR7BJF6XX25&address=',
    Linea: 'https://api.lineascan.build/api?module=account&action=balance&tag=latest&apikey=I6D591367TT68PGT1IAYM8VD4SUD46RWE9&address=',
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

    try {
      const requests = Object.keys(chainMapping).map(async (chain) => {
        const apiUrl = `${chainMapping[chain]}${contractAddress}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.status}`);
        }

        const data = await response.json();
        const tokenBalance = (data.result / 1e18).toFixed(3);
        const value = ethPrice !== null ? (tokenBalance * ethPrice).toFixed(3) : '';

        if (tokenBalance !== '0.000') {
          updatedBalances[chain] = {
            tokenBalance,
            value,
          };
        }
      });

      await Promise.all([fetchEthPrice(), fetchHistoricalPrice(), ...requests]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setBalances(updatedBalances);
      setShowTable(true);
    }
  };

  const handleFetchData = async () => {
    await fetchData();
  };

  useEffect(() => {
    fetchEthPrice();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div className="NavBar">
          <div className="NavBarTitle">Flint Labs Assignment - Crypto Explorer</div>
        </div>
        <p>
          <span>Enter Contract Address:</span>
          <input type="text" value={contractAddress} onChange={handleInputChange} />
          <button onClick={handleFetchData}>Fetch Data</button>
        </p>
        {loading && <Loader />}
        {showTable && !loading && ethPrice !== null && percentageChange !== null && Object.keys(balances).length > 0 && (
          <table className="Table">
            <thead>
              <tr>
                <th>Chain</th>
                <th>Ethereum/Native Token Price (USD)</th>
                <th>Token Balance</th>
                <th>Value (USD)</th>
                <th>Percentage Change (Last 12 Hrs)</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(balances).map(chain => (
                <tr key={chain}>
                  <td>{chain}</td>
                  <td>${ethPrice}</td>
                  <td>{balances[chain].tokenBalance}</td>
                  <td>${balances[chain].value}</td>
                  <td>{percentageChange}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {showTable && ethPrice !== null && percentageChange !== null && (
          <div className="SpeedometerContainer">
            <Speedometer
              width={300}
              height={180}
              minValue={-25}
              maxValue={25}
              value={parseFloat(percentageChange)}
              needleColor="red"
              customSegmentStops={[-25, -10, -5, 0, 5, 10, 25]}
            />
            
          </div>
        )}

        {showTable && percentageChange !== null && parseFloat(percentageChange) > 10 && (
          <div className="AlertContainer">Alert: Percentage Change more than 10%</div>
        )}
      </header>
    </div>
  );
}

export default App;
