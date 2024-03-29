import React, {useState} from 'react';
import logo from './logo.svg';
import './App.css';
import { SequenceIndexerClient } from '@0xsequence/indexer'

import { ethers } from 'ethers'
import { sequence } from '0xsequence'

import settings from './imgs/settings.png'
import sign_out from './imgs/sign_out.png'
import { TextInput } from '@0xsequence/design-system'

import {Card, Tag, Box as Box1, IconButton, useTheme, SunIcon, Button as Button1} from '@0xsequence/design-system'

//@ts-ignore
import debounce from 'lodash.debounce'
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const steps = ['Login with New Destination Wallet', 'Login with Origin Wallet', 'Transfer'];

let count = 0

let accessKey = 'AQAAAAAAAAcSKkCNRpspu50Z6qDV_O0ZR8o'

function Transfer(props: any) {
  const [tokenNumber, setTokenNumber] = useState(0)
  const [erc20Count, setErc20Count] = useState(0)
  const [erc721Count, setErc721Count] = useState(0)
  const [erc1155Count, setErc1155Count] = useState(0)
  const [balances, setBalances] = useState<any>(null)

  const transfer = async () => {
    let tokenId;
    const wallet = await sequence.getWallet()
    const recipientAddress = props.destinationAddress
    const originAddress = await wallet.getAddress()
    const transactions: any = []

    balances.balances.map((token: any) => {
      if(token.contractType == 'ERC20'){

        const erc20Interface = new ethers.utils.Interface([
          'function transfer(address _to, uint256 _value)'
        ])

        const data = erc20Interface.encodeFunctionData(
          'transfer', [recipientAddress, token.balance]
        )
        
        const transaction = {
          to: token.contractAddress,
          data
        }

        transactions.push(transaction)
      }

      if(token.contractType == 'ERC721'){

        const erc721Interface = new ethers.utils.Interface([
          'function safeTransferFrom(address _from, address _to, uint256 _tokenId)'
        ])
        
        for(let i = 0; i < 1; i++){
          // Encode the transfer of the NFT tokenId to recipient
          const data = erc721Interface.encodeFunctionData(
            'safeTransferFrom', [originAddress, recipientAddress, token.tokenID]
          )
          
          const transaction = {
            to: token.contractAddress,
            data
          }

          transactions.push(transaction)
        }
      }

      if(token.contractType == 'ERC1155'){
        const erc1155Interface = new ethers.utils.Interface([
          'function safeTransferFrom(address _from, address _to, uint256 _tokenId)'
        ])
        
        for(let i = 0; i < Number(token.balance); i++){
          // Encode the transfer of the NFT tokenId to recipient
          const data = erc1155Interface.encodeFunctionData(
            'safeTransferFrom', [originAddress, recipientAddress, token.tokenID]
          )
          
          const transaction = {
            to: token.contractAddress,
            data
          }

          transactions.push(transaction)
        }
      }
    })

    console.log(transactions)
    const signer = wallet.getSigner()

    try{
        if(transactions.length > 20) alert('please note: you will see multiple transactions because you are sending more than 20 tokens')
        const batchSize = 20;
        const totalTokens = transactions.length;
        
        for (let i = 0; i < totalTokens; i += batchSize) {
          const batch = transactions.slice(i, i + batchSize);
          
          const txnResponse = await signer.sendTransaction(batch)
          console.log(txnResponse)
        }
    }catch(err){
      alert('please transfer tokens again')
    }
  }

  const getBalances = async () => {

    const indexer = new SequenceIndexerClient('https://polygon-indexer.sequence.app')

    // try any account address you'd like :)
    const accountAddress = props.originAddress

    // query Sequence Indexer for all token balances of the account on Polygon
    const tokenBalances = await indexer.getTokenBalances({
        accountAddress: accountAddress,
        includeMetadata: true
    })

    setBalances(tokenBalances)
    const countERC20 = tokenBalances.balances.filter(item => item.contractType === 'ERC20').length
    const countERC721 = tokenBalances.balances.filter(item => item.contractType === 'ERC721').length
    const countERC1155 = tokenBalances.balances.filter(item => item.contractType === 'ERC1155').length
    setErc20Count(countERC20)
    setErc721Count(countERC721)
    setErc1155Count(countERC1155)
  }

  React.useEffect(() => {
    getBalances()
  }, [])

  return(
    <>
        <br/>
        <Box1 gap='6' justifyContent={'center'}>
          <Card justifyContent={'center'} width="1/3" style={{minWidth: '150px'}}>
            <br/>
          <p className='info'><Tag label='origin'/> : {props.originAddress.slice(0,10)}...</p>
            <br/>
          </Card>
          <p className='info' style={{marginTop: '17px'}}>→</p>
          <Card justifyContent={'center'} width="1/3"  style={{minWidth: '150px'}}>
            <br/>
            <p className='info'><Tag label='destination'/> : {props.destinationAddress.slice(0,10)}...</p>
            <br/>
          </Card>
        </Box1>
        <br/>
        <Box1 width='1/4' style={{margin: 'auto'}} justifyContent={'center'}>
          <table>
            <tr>
              <th>Protocol</th>
              <th>Token(s)</th>
            </tr>
            <tr>
              <td>ERC20</td>
              <td>{erc20Count}</td>
            </tr>
            <tr>
              <td>ERC721</td>
              <td>{erc721Count}</td>
            </tr>
            <tr>
              <td>ERC1155</td>
              <td>{erc1155Count}</td>
            </tr>
          </table>
        </Box1>
        <br/>
        <p className='info'>would you like to proceed with the {erc20Count+erc721Count+erc1155Count} transfers?</p>
        <br/>
        <br/>
      <button className="connect-button" onClick={transfer}>transfer tokens</button>
      <br/>
      <br/>
      <br/>
      <br/>
    </>
  )
}

function OriginLogin(props: any) {

  const [isLoggedOut, setIsLoggedOut] = useState(false)

  sequence.initWallet(accessKey, {
    defaultNetwork: 'polygon'
  })

  const connect = async () => {

    const wallet = sequence.getWallet()

    const connectWallet = await wallet.connect({
      app: 'Sequence Migrations from Origin Wallet',
      refresh: true,
      settings: {
        theme: 'dark'
      },
      askForEmail: true
    })

    if(connectWallet.connected){
      props.setOriginAddress(connectWallet?.session?.accountAddress)
      props.handleNext()
    }
  }
  // const logout = async () => {
  //   (await sequence.getWallet()).openWallet()
  //   setInterval(async () => {
  //     try{
  //       console.log(await (await sequence.getWallet()).getAddress())
  //     }catch(e){
  //       setIsLoggedOut(true)
  //     }
  //   }, 1000)
  // }
  return(
    <>
      <br/>
      <br/>
      {/* {! isLoggedOut ?  <p className='info'>Logout when the wallet opens, before signing in again</p> : <p> Sign in with the wallet for where you want your tokens to originate</p>} */}
      {/* <br/> */}
      {/* {! isLoggedOut ? <img src={settings} width={'200px'} /> : null} */}
      &nbsp;
      &nbsp;
      &nbsp;
      {/* {! isLoggedOut ? <img src={sign_out} width={'200px'} /> : null} */}
      <br/>
      <br/>
      <br/>
      {<button className="connect-button" onClick={connect}>connect origin</button>}
    </>
  )
}

function DestinationLogin(props: any) {

  sequence.initWallet(accessKey, {
    defaultNetwork: 'polygon'
  })

  const connect = async () => {
    const wallet = sequence.getWallet()

    const connectWallet = await wallet.connect({
      app: 'Sequence Migrations from Destination Wallet',
      authorize: true,
      settings: {
        theme: 'dark'
      },
      askForEmail: true
    })

    if(connectWallet.connected){
      props.setDestinationAddress(connectWallet?.session?.accountAddress)
      props.handleNext()
    }
  }

  // const handleAddressChange = (value) => {

  // }

  const [debouncedValue, setDebouncedValue] = useState('');
  const [inputValue, setInputValue] = useState('');

  const handleAddressChange = (value: any) => {
    setInputValue(value);
    setDebouncedValue(value);
  };

  const myFunction = () => {
      if(isValidEthereumAddress(debouncedValue)) {props.handleNext(); props.setDestinationAddress(debouncedValue)}
    };
  
    // Debounce the myFunction
    const debouncedMyFunction = debounce(myFunction, 2000);
  
    React.useEffect(() => {
      if (debouncedValue) {
        debouncedMyFunction();
      }
  
      // Cleanup
      return () => {
        debouncedMyFunction.cancel();
      };
    }, [debouncedValue]);

  function isValidEthereumAddress(address: any) {
    try {
        return ethers.utils.getAddress(address).toLowerCase() === address.toLowerCase();
    } catch (e) {
        return false;
    }
  }

  return(
    <>
      <br/>
      <br/>
      <p className='info'>Input the wallet for where you want your tokens to go</p>
      <br/>
      <br/>
      <div className='container'>
        <Box justifyContent={'center'}>
        <Box style={{width: '400px'}} >
          <TextInput placeholder={"input destination wallet"} onChange={(evt: any) => handleAddressChange(evt.target.value)}/>
        </Box>
        </Box>
      </div>
      {/* <button className="connect-button" onClick={connect}>connect destination</button> */}
    </>
  )
}

function HorizontalLinearStepper(props: any) {
  const [activeStep, setActiveStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set<number>());
  const [panel, setPanel] = React.useState(null)

  const Compass = (activeStep: any, connectors: any, connect: any, address: any, handleNext: any) => {
    let navigator;
      switch(activeStep){
        case 0:
          navigator = <DestinationLogin setDestinationAddress={props.setDestinationAddress} handleNext={handleNext}/>
          break;
        case 1:
          navigator = <OriginLogin setOriginAddress={props.setOriginAddress} handleNext={handleNext}/>
          break;
        default:
          navigator = <Transfer destinationAddress={props.destinationAddress} originAddress={props.originAddress} handleNext={handleNext}/>
      }
    return(
      <>
      <br/>
        {
          navigator
        }
      </>
    )
  }
  const isStepOptional = (step: number) => {
    return step === 4;
  };

  const isStepSkipped = (step: number) => {
    return skipped.has(step);
  };

  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      // You probably want to guard against something like this,
      // it should never occur unless someone's actively trying to break something.
      throw new Error("You can't skip a step that isn't optional.");
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  };

  const handleReset = () => {
    setActiveStep(0);
    count = 0;
    props.disconnect()
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper activeStep={activeStep}>
        {steps.map((label, index) => {
          const stepProps: { completed?: boolean } = {};
          const labelProps: {
            optional?: React.ReactNode;
          } = {};
          if (isStepOptional(index)) {
            labelProps.optional = (
              <Typography variant="caption">Optional</Typography>
            );
          }
          if (isStepSkipped(index)) {
            stepProps.completed = false;
          }
          return (
            <Step key={label} {...stepProps}>
              <StepLabel {...labelProps}>{label}</StepLabel>
            </Step>
          );
        })}
      </Stepper>
      {activeStep === steps.length ? (
        <React.Fragment>
            <p className="completion">All steps completed - you&apos;re finished</p>
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button onClick={handleReset}>Reset</Button>
          </Box>
        </React.Fragment>
      ) : (
        <React.Fragment>
          {Compass(activeStep, props.connectors, props.connect, props.address, handleNext)}
        </React.Fragment>
      )}
    </Box>
  );
}

function App() {
  const {theme, setTheme} = useTheme()

  setTheme('dark')

  const [destinationAddress, setDestinationAddress] = useState("")
  const [originAddress, setOriginAddress] = useState("")

  return (
    <div className="App">
      <br/>
      <br/>
      <br/>
      <br/>
      <br/>
      <img className="center" src="https://sequence.xyz/sequence-wordmark.svg" />
      <br/>
      <br/>
      <p className='info'>wallet token migration</p>
      <br/>
      <br/>
      <div>
      <Box1 style={{margin: 'auto'}} width='1/2'>
        <HorizontalLinearStepper setDestinationAddress={setDestinationAddress} setOriginAddress={setOriginAddress} destinationAddress={destinationAddress} originAddress={originAddress}/>
      </Box1>
    </div>
    </div>
  );
}

export default App;