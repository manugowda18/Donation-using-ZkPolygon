import Head from "next/head";
import styles from "../styles/Home.module.css";
import Image from "next/image";
import { Inter } from "next/font/google";
import Web3Modal from "web3modal";
import { providers, Contract, utils, BigNumber } from "ethers";
import { useEffect, useRef, useState } from "react";
import { MY_CONTRACT_ADDRESS, abi } from "../constants";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [donationReason, setDonationReason] = useState("");
  const [donationAmount, setDonationAmount] = useState(0);
  const web3ModalRef = useRef();
  const [filteredEvents, setFilteredEvents] = useState([]);

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the zkEVM network, let them know by throwing an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 1442) {
      window.alert("Change the network to zkEVM");
      throw new Error("Change network to zkEVM");
    }

    if (needSigner) {
      return web3Provider.getSigner();
    }
    return web3Provider;
  };

  useEffect(() => {
    const initializeWeb3Modal = () => {
      web3ModalRef.current = new Web3Modal({
        network: "zkEVM",
        providerOptions: {},
        disableInjectedProvider: false,
      });
    };

    if (!walletConnected) {
      initializeWeb3Modal();
      connectWallet();
    }
  }, [walletConnected]);

  // get log data

  useEffect(() => {
    const listen = async () => {
      const signer = await getProviderOrSigner(true);
      // Create a new instance of the Contract with a Signer
      const donationContract = new Contract(MY_CONTRACT_ADDRESS, abi, signer);
      donationContract.on(
        "LogData",
        (amount, reason, donatorAddress, timestamp, event) => {
          let info = {
            amount: amount.toString(),
            reason: reason.toString(),
            donatorAddress: donatorAddress.toString(),
            timestamp: timestamp.toString(),
            data: event,
          };
          console.log(JSON.stringify(info, null, 4));
          alert(`Thank you for your donation of ${amount} Wei!`);
        }
      );
    };
    if (walletConnected) listen();
  }, [walletConnected]);

  const setDonation = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      // Create a new instance of the Contract with a Signer
      const donationContract = new Contract(MY_CONTRACT_ADDRESS, abi, signer);
      // call the offerDonation function from the contract
      setLoading(true);
      const tx = await donationContract.offerDonation(donationReason, {
        value: donationAmount, // donation is in wei
      });
      await tx.wait();
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const getDonationEvents = async () => {
    try {
      const provider = await getProviderOrSigner();
      const donationContract = new Contract(MY_CONTRACT_ADDRESS, abi, provider);
      // console.log( donationContract)

      // Define the event you want to retrieve logs for
      const eventName = "LogData";

      const eventSignature = donationContract.interface.getEvent(eventName);
      // Define the block range to search for event logs
      console.log(); // Retrieve the past event logs
      provider
        .getLogs({
          address: MY_CONTRACT_ADDRESS,
          topics: [utils.id(`LogData(uint256,string,address,uint256)`)],
          fromBlock: 1444428, // Starting block number
          toBlock: "latest", // Latest block number
        })
        .then((logs) => {
          // console.log(logs)
          // Process the retrieved event logs
          const filteredLogs = logs.filter((log) => {
            const amount = log.topics[1];
            // console.log(amount)
            // convert the amount from hex to decimal
            const amountInDecimal = BigNumber.from(amount).toNumber();
            // console.log(amountInDecimal)if
            if (amountInDecimal > 45) {
              return true;
            }
          });
          setFilteredEvents(filteredLogs);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    } catch (err) {
      console.error(err);
    }
  };

  const renderButton = () => {
    if (walletConnected) {
      return <span>connected</span>;
    } else {
      return (
        <button
          style={{ cursor: "pointer", backgroundColor: "blue" }}
          onClick={connectWallet}
        >
          Connect your wallet
        </button>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Donation dApp</title>
        <meta name="description" content="Donation-Dapp" />
        <link rel="icon" href="/logo-charmingdata-small.ico" />
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
        <div className={styles.description}>
          <div>
            <a
              href="https://www.youtube.com/@CharmingData/videos"
              target="_blank"
            >
              By{" "}
              <Image
                src="/logocharmingdata.png"
                alt="charmingdata Logo"
                width={25}
                height={25}
                priority
              />{" "}
              Charming Data
            </a>
          </div>
        </div>
        <div>
          <div
            style={{
              display: "flex",
              // justify end
              alignItems: "flex-end",
              justifyContent: "flex-end",
            }}
          >
            {renderButton()}
          </div>
          <h1 className={styles.title}>
            Welcome to the Educator Donation dApp!
          </h1>
          <div className={styles.description}>
            A contract where you can thank and donate to online educators.
          </div>
          <br></br>
          <div>
            <label>Reason for donation: </label>
            <input
              type="text"
              value={donationReason}
              onChange={(e) => setDonationReason(e.target.value)}
              style={{ marginRight: ".5rem" }}
            />
            <br></br>
            <label>Donation amount (wei): </label>
            <input
              type="number"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              style={{ marginRight: ".5rem" }}
            />
            <br></br>
            <button
              onClick={setDonation}
              style={{ cursor: "pointer", backgroundColor: "blue" }}
            >
              {loading ? <p>Loading...</p> : <p>Submit</p>}
            </button>
          </div>
          <br></br>
          <div>
            <button
              onClick={getDonationEvents}
              style={{ cursor: "pointer", backgroundColor: "blue" }}
            >
              See donations over 45 wei
            </button>
            {/* create a table with 2 columns named reason and amount */}
            <table
              style={{
                border: "1px solid white",
                marginTop: "1rem",
              }}
            >
              <thead>
                <tr>
                  <th>Reason</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event, index) => {
                  const amount = event.topics[1];
                  // convert the amount from hex to decimal
                  const amountInDecimal = BigNumber.from(amount).toNumber();
                  // Create an instance of the contract interface
                  const iface = new utils.Interface(abi);

                  // Define the event data
                  const eventData = event.data; // Replace with your event data
                  const eventName = "LogData"; // Replace with your event name
                  // Decode the event data
                  const decodedData = iface.decodeEventLog(
                    eventName,
                    eventData,
                    event.topics
                  );

                  return (
                    <tr key={index}>
                      <td
                        style={{
                          padding: "1rem",
                        }}
                      >
                        {decodedData.reason}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                        }}
                      >
                        {amountInDecimal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className={styles.grid}>
          <a
            href="https://www.linkedin.com/in/charmingdata/"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2>
              LinkedIn <span>-&gt;</span>
            </h2>
            <p>Connect with us to stay on top of the latest blockchain news.</p>
          </a>

          <a
            href="https://github.com/charmingdata"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2>
              GitHub <span>-&gt;</span>
            </h2>
            <p>
              Follow the repo to get notified of new smart contracts & dApps.
            </p>
          </a>

          <a
            href="https://www.patreon.com/charmingdata"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2>
              Patreon <span>-&gt;</span>
            </h2>
            <p>Your support keeps Charming Data running.</p>
          </a>

          <a
            href="https://www.youtube.com/@CharmingData/videos"
            className={styles.card}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h2>
              Youtube <span>-&gt;</span>
            </h2>
            <p>Join us to receive notifications of future video tutorials.</p>
          </a>
        </div>
        {/*  */}
      </main>
    </div>
  );
}
