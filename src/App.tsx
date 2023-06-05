import React, {useState} from 'react';
import logo from './logo.svg';
import './App.css';
import { SequenceIndexerClient } from '@0xsequence/indexer'

import { ethers } from 'ethers'
import { sequence } from '0xsequence'

import settings from './imgs/settings.png'
import sign_out from './imgs/sign_out.png'

import {Card, Tag, CheckmarkIcon, Box as Box1, IconButton, useTheme, SunIcon, ChevronRightIcon, ChevronLeftIcon, 
  Spinner, Placeholder, Button as Button1} from '@0xsequence/design-system'


import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

const steps = ['Login with New Destination Wallet', 'Login with Origin Wallet', 'Transfer'];

let count = 0

function Transfer(props: any) {
  const [tokenNumber, setTokenNumber] = useState(0)
  const [erc20Count, setErc20Count] = useState(0)
  const [erc721Count, setErc721Count] = useState(0)
  const [erc1155Count, setErc1155Count] = useState(0)
  const transfer = async () => {
    console.log('transfer')
  }

  const getBalances = async () => {

    const indexer = new SequenceIndexerClient('https://mumbai-indexer.sequence.app')

    // try any account address you'd like :)
    const accountAddress = props.originAddress

    // query Sequence Indexer for all token balances of the account on Polygon
    const tokenBalances = await indexer.getTokenBalances({
        accountAddress: accountAddress,
        includeMetadata: true
    })
    console.log('tokens in your account:', tokenBalances)

    const countERC20 = tokenBalances.balances.filter(item => item.contractType === 'ERC20').length
    const countERC721 = tokenBalances.balances.filter(item => item.contractType === 'ERC721').length
    const countERC1155 = tokenBalances.balances.filter(item => item.contractType === 'ERC1155').length
    setErc20Count(countERC20)
    setErc721Count(countERC721)
    setErc1155Count(countERC1155)
  }

  React.useEffect(() => {
    console.log('calling indexer')
    getBalances()
  })

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

  sequence.initWallet('mumbai')

  const connect = async () => {

    const wallet = sequence.getWallet()

    const connectWallet = await wallet.connect({
      app: 'Sequence Migrations from Origin Wallet',
      networkId: 80001,
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
  const logout = async () => {
    (await sequence.getWallet()).openWallet()
    setInterval(async () => {
      try{
        console.log(await (await sequence.getWallet()).getAddress())
      }catch(e){
        setIsLoggedOut(true)
      }
    }, 1000)
  }
  return(
    <>
      <br/>
      <br/>
      {! isLoggedOut ?  <p className='info'>Logout when the wallet opens, before signing in again</p> : <p> Sign in with the wallet for where you want your tokens to originate</p>}
      <br/>
      {! isLoggedOut ? <img src={settings} width={'200px'} /> : null}
      &nbsp;
      &nbsp;
      &nbsp;
      {! isLoggedOut ? <img src={sign_out} width={'200px'} /> : null}
      <br/>
      <br/>
      <br/>
      {isLoggedOut ?  <button className="connect-button" onClick={connect}>connect origin</button> : <button className="connect-button" onClick={logout}>logout</button>}
    </>
  )
}

function DestinationLogin(props: any) {

  sequence.initWallet('mumbai')

  const connect = async () => {
    const wallet = sequence.getWallet()

    const connectWallet = await wallet.connect({
      app: 'Sequence Migrations from Destination Wallet',
      networkId: 80001,
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

  return(
    <>
      <br/>
      <br/>
      <p className='info'>Sign in with the wallet for where you want your tokens to go</p>
      <br/>
      <br/>
      <button className="connect-button" onClick={connect}>connect destination</button>
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

  const [destinationAddress, setDestinationAddress] = useState("")
  const [originAddress, setOriginAddress] = useState("")

  return (
    <div className="App">
      <Box gap='6'>
        <IconButton style={{position: 'fixed', top: '20px', right: '20px'}} icon={SunIcon} onClick={() => {
          setTheme(theme == 'dark' ? 'light' : 'dark')
          // setThemeLoading(true)
        }}/>
      </Box>
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
