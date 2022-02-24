import React, { useEffect, useState } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import { ethers } from 'ethers'
import 'react-toastify/dist/ReactToastify.css'

import Head from 'next/head'

// Import abi
import abi from '../utils/CoffeePortal.json'

export default function Home() {
  /**
   * Create a variable here that holds the contract address after you deploy!
   */
  const contractAddress = '0x18fCBBF31DBa9815F5b63981F271F58E434066D0'

  /**
   * Create a variable here that references the abi content!
   */
  const contractABI = abi.abi

  /*
   * Just a state variable we use to store our user's public wallet.
   */
  const [currentAccount, setCurrentAccount] = useState('')

  const [message, setMessage] = useState('')

  const [name, setName] = useState('')

  /*
   * All state property to store all coffee
   */
  const [allCoffee, setAllCoffee] = useState([])

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window

      /*
       * Check if we're authorized to access the user's wallet
       */
      const accounts = await ethereum.request({ method: 'eth_accounts' })

      if (accounts.length !== 0) {
        const account = accounts[0]
        setCurrentAccount(account)
        toast.success('🦄 Wallet is Connected', {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
      } else {
        toast.warn('Make sure you have MetaMask Connected', {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
      }
    } catch (error) {
      toast.error(`${error.message}`, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
    }
  }

  /**
   * Implement your connectWallet method here
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window

      if (!ethereum) {
        toast.warn('Make sure you have MetaMask Connected', {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
        return
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      })
      setCurrentAccount(accounts[0])
    } catch (error) {
      console.log(error)
    }
  }

  const buyCoffee = async () => {
    try {
      const { ethereum } = window

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const coffeePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        )

        let count = await coffeePortalContract.getTotalCoffee()
        console.log('Retrieved total coffee count...', count.toNumber())

        /*
         * Execute the actual coffee from your smart contract
         */
        const coffeeTxn = await coffeePortalContract.buyCoffee(
          message ? message : 'Enjoy Your Coffee',
          name ? name : 'Anonymous',
          ethers.utils.parseEther('0.001'),
          {
            gasLimit: 300000,
          }
        )
        console.log('Mining...', coffeeTxn.hash)

        toast.info('Sending Fund for coffee...', {
          position: 'top-left',
          autoClose: 18050,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
        await coffeeTxn.wait()

        console.log('Mined -- ', coffeeTxn.hash)

        count = await coffeePortalContract.getTotalCoffee()

        console.log('Retrieved total coffee count...', count.toNumber())

        setMessage('')
        setName('')

        toast.success('Coffee Purchased!', {
          position: 'top-left',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      toast.error(`${error.message}`, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })
    }
  }

  /*
   * Create a method that gets all coffee from your contract
   */
  const getAllCoffee = async () => {
    try {
      const { ethereum } = window
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const signer = provider.getSigner()
        const coffeePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        )

        /*
         * Call the getAllCoffee method from your Smart Contract
         */
        const coffees = await coffeePortalContract.getAllCoffee()

        /*
         * We only need address, timestamp, name, and message in our UI so let's
         * pick those out
         */
        const coffeeCleaned = coffees.map((coffee) => {
          return {
            address: coffee.giver,
            timestamp: new Date(coffee.timestamp * 1000),
            message: coffee.message,
            name: coffee.name,
          }
        })

        /*
         * Store our data in React State
         */
        setAllCoffee(coffeeCleaned)
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error)
    }
  }

  /*
   * This runs our function when the page loads.
   */
  useEffect(() => {
    let coffeePortalContract
    getAllCoffee()
    checkIfWalletIsConnected()

    const onNewCoffee = (from, timestamp, message, name) => {
      console.log('NewCoffee', from, timestamp, message, name)
      setAllCoffee((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
          name: name,
        },
      ])
    }

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      coffeePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      )
      coffeePortalContract.on('NewCoffee', onNewCoffee)
    }

    return () => {
      if (coffeePortalContract) {
        coffeePortalContract.off('NewCoffee', onNewCoffee)
      }
    }
  }, [])

  const handleOnMessageChange = (event) => {
    const { value } = event.target
    setMessage(value)
  }
  const handleOnNameChange = (event) => {
    const { value } = event.target
    setName(value)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>
        <title>Mini Buy Me a Coffee</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
        <h1 className="mb-6 text-6xl font-bold text-blue-600">
          Buy Me A Coffee
        </h1>
        {/*
         * If there is currentAccount render this form, else render a button to connect wallet
         */}

        {currentAccount ? (
          <div className="sticky top-3 z-50 w-full max-w-xs ">
            <form className="mb-4 rounded bg-white px-8 pt-6 pb-8 shadow-md">
              <div className="mb-4">
                <label
                  className="mb-2 block text-sm font-bold text-gray-700"
                  htmlFor="name"
                >
                  Name
                </label>
                <input
                  className="focus:shadow-outline w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                  id="name"
                  type="text"
                  placeholder="Name"
                  onChange={handleOnNameChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  className="mb-2 block text-sm font-bold text-gray-700"
                  htmlFor="message"
                >
                  Send the Creator a Message
                </label>

                <textarea
                  className="form-textarea focus:shadow-outline mt-1 block w-full appearance-none rounded border py-2 px-3 leading-tight text-gray-700 shadow focus:outline-none"
                  rows="3"
                  placeholder="Message"
                  id="message"
                  onChange={handleOnMessageChange}
                  required
                ></textarea>
              </div>

              <div className="items-left flex justify-between">
                <button
                  className="focus:shadow-outline rounded bg-blue-500 py-2 px-4 text-center font-bold text-white hover:bg-blue-700 focus:outline-none"
                  type="button"
                  onClick={buyCoffee}
                >
                  Support $5
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            className="mt-3 rounded-full bg-blue-500 py-2 px-3 font-bold text-white hover:bg-blue-700"
            onClick={connectWallet}
          >
            Connect Your Wallet
          </button>
        )}

        {allCoffee.map((coffee, index) => {
          return (
            <div className="mt-10 border-l-2" key={index}>
              <div className="relative ml-10 mb-10 flex transform cursor-pointer flex-col items-center space-y-4 rounded bg-blue-800 px-6 py-4 text-white transition hover:-translate-y-2 md:flex-row md:space-y-0">
                {/* <!-- Dot Following the Left Vertical Line --> */}
                <div className="absolute -left-10 z-10 mt-2 h-5 w-5 -translate-x-2/4 transform rounded-full bg-blue-600 md:mt-0"></div>

                {/* <!-- Line that connecting the box with the vertical line --> */}
                <div className="absolute -left-10 z-0 h-1 w-10 bg-green-300"></div>

                {/* <!-- Content that showing in the box --> */}
                <div className="flex-auto">
                  <h1 className="text-md">Supporter: {coffee.name}</h1>
                  <h1 className="text-md">Message: {coffee.message}</h1>
                  <h3>Address: {coffee.address}</h3>
                  <h1 className="text-md font-bold">
                    TimeStamp: {coffee.timestamp.toString()}
                  </h1>
                </div>
              </div>
            </div>
          )
        })}
      </main>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  )
}
