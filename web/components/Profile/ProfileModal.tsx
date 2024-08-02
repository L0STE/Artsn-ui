import '@/styles/ProfileModal.scss';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Dynamic from 'next/dynamic';
import { Calendar, Select, theme } from 'antd';
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection } from "@solana/web3.js";
import { checkLogin } from '@/components/Web3Auth/solanaRPC';
import { initProfileTx } from '../Protocol/functions';
import { toastPromise, toastError } from '@/helpers/toast';
import RPC from "@/components/Web3Auth/solanaRPC";
import ImgCrop from 'antd-img-crop';
import { MdOutlineFileUpload } from 'react-icons/md';
import { useMutation } from "@apollo/client";
import { ADD_USER } from "@/lib/mutations";
import useSWRMutation from "swr/mutation";
import Logo from '@/public/assets/login/logo_bw.svg';
import OndatoWrapper from '@/components/Profile/Ondato/OndatoWrapper';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { countries } from '@/lib/countries';
import { confirm } from '@/hooks/confirmTx';
import { toast } from 'react-toastify';
const Upload = Dynamic(() => import('antd').then((mod) => mod.Upload), { ssr: false });
const Input = Dynamic(() => import('antd').then((mod) => mod.Input), { ssr: false });

type Profile = {
    fullName?: string,
    userName?: string,
    email?: string,
    dob?: string,
    address: {
        building_number?: string,
        street?: string,
        town?: string,
        postcode?: string,
        country?: string
    }
}

interface ProfileModalProps {
    showModal: boolean;
    page?: number;
    offChainProfile?: Profile;
    handleClose: () => void;
    handleCloseThenCheck: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ showModal, page, offChainProfile, handleClose, handleCloseThenCheck }) => {
    const { publicKey, sendTransaction } = useWallet();
    const { token } = theme.useToken();
    const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
    const [creating, setCreating] = useState<boolean>(false);
    const [isOpen, setIsOpen] = useState(showModal);
    const [activePage, setActivePage] = useState(page ? page : 1);
    const [web3AuthPublicKey, setWeb3AuthPublicKey] = useState<string | null>(null);
    const [verificationPending, setVerificationPending] = useState<boolean>(false);
    const [verificationNeeded, setVerificationNeeded] = useState<boolean>(false);
    const [rpc, setRpc] = useState<RPC | null>(null);
    
    const [fileList, setFileList] = useState([]);
    const [selectedValue, setSelectedValue] = useState<Dayjs>(
        dayjs('1990-01-31')
    );
    const [profile, setProfile] = useState<Profile | null>({
        fullName: offChainProfile ? offChainProfile.fullName : '',
        userName: '',
        email: '',
        dob: '', //'1990-01-31'
        address: {
            building_number: '',
            street: '',
            town: '',
            postcode: '',
            country: '',
        }
    });
    const [addUser, { loading, error, data }] = useMutation(ADD_USER);
    {!loading && !error && data && (
        handleCloseThenCheck()
    )}
    {error && (
        console.log('Error submitting', error),
        toast.error('Error submitting, please try again')
    )}
    {loading && (
        console.log('Submitting...')
    )}
    const connection = new Connection(
        process.env.NEXT_PUBLIC_HELIUS_DEVNET!,
        "confirmed"
    );

    // MODAL ACTIONS***************************************************************
    const handlePageChange = (page: number) => {
        console.log('handle page change')
        setActivePage(page)
    }

    const handleCloseModal = () => {
        setIsOpen(false);
        handleClose();
    }

    const handleCloseCheck = () => {
        setIsOpen(false);
        handleCloseThenCheck();
    }

    // CALENDAR PICKER FUNCTIONS****************************************************
    const onSelect = (newValue: Dayjs) => {
        setProfile(
            { ...profile!, dob: newValue.format('YYYY-MM-DD') }
        );
        console.log('selected value', newValue.format('YYYY-MM-DD'));
        setSelectedValue(newValue);
      };
    
    const onPanelChange = (newValue: Dayjs) => {
        setProfile(
            { ...profile!, dob: newValue.format('YYYY-MM-DD') }
        );
    };

    // COUNTRY SELECTION***********************************************************
    const handleChange = (value: string) => {
        setProfile(
            { ...profile, address: { ...profile!.address, country: value } }
        );
      };

    // @ts-expect-error - fileList is not empty
    const onChange = ({ fileList: newFileList }) => {

        setFileList(newFileList);
      };
    // @ts-expect-error - file
    const onPreview = async (file) => {
        let src = file.url;
        if (!src) {
          src = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file.originFileObj);
            reader.onload = () => resolve(reader.result);
          });
        }
        // @ts-expect-error - image
        const image = new Image();
        image.src = src!;
        const imgWindow = window.open(src);
        imgWindow?.document.write(image.outerHTML);
      };
    
    // S3 IMAGE UPLOAD AND FETCH****************************************************
    async function uploadDocuments(
        url: string,
        { arg }: { arg: { files: Blob[] } }
    ) {
        const body = new FormData();
        if(fileList.length < 1){
            return;
        }
        arg.files.forEach((file: Blob) => {
            // @ts-expect-error - fileList not empty
          body.append("file", file, `${publicKey ? publicKey.toBase58() : web3AuthPublicKey}.${fileList[0].name.split('.').pop()}`);
        });
        try {
            const response = await fetch(url, { method: "POST", body });
            console.log('upload response', await response.json())
            return await response.json();
        } catch (error) {
            console.error('Error uploading documents', error);
        }
    }
    const { trigger } = useSWRMutation("/api/aws/s3/upload", uploadDocuments);
    
    async function initProfile(key: string | null) {        
        try {
            if(!publicKey && !web3AuthPublicKey){
                console.log('no public key');
                return;
            }
            if(publicKey && profile?.userName){
                const tx = await initProfileTx(publicKey.toBase58(), profile.userName);
                console.log(
                    `Transaction `
                );
                console.log(tx);
                const signature = await sendTransaction(tx, connection, 
                    {
                        skipPreflight: true,
                    },
                );

                console.log('signature', signature);

                const confirmation_sig = await confirm(connection, signature);

                if(confirmation_sig){
                    console.log('profile init hash:', confirmation_sig);
                    return;
                } else {
                    console.log('error initializing profile');
                    toastError('Error initializing profile');
                }
            }

            if(web3AuthPublicKey !== null && !publicKey && profile?.userName){
                const signature = await initProfileTx(web3AuthPublicKey, profile.userName);
               
                console.log(
                    `Transaction sent: https://explorer.solana.com/tx/${signature}?cluster=devnet`
                );
                const confirmation_sig = await confirm(connection, signature);

                if(confirmation_sig){
                    console.log('profile init hash:', confirmation_sig);
                    return;
                } else {
                    console.log('error initializing profile');
                    toastError('Error initializing profile');
                }
                return;
            }
        } catch (error) {
            console.error('Error sending transaction', error);
            toastError('Error sending transaction');
        }
    }

    async function createProfile(key: string) {
        setCreating(true);
        if(fileList.length < 1){
            toastError('Please upload a profile picture');
        }
        const fileListBlob = fileList.map((file: { originFileObj: Blob; type: string; }) => {
            return new Blob([file.originFileObj], { type: file.type });
        });
        

        await initProfile(key);
        await trigger({ files: fileListBlob });
        addUser({
            variables: {
                fullName: profile!.fullName,
                userName: profile!.userName,
                email: profile!.email,
                wallet: publicKey ? publicKey.toBase58() : web3AuthPublicKey,
                currencyPreference: '$USD',
                // @ts-expect-error - fileList is not empty
                profileImg: `https://artisan-solana.s3.eu-central-1.amazonaws.com/${publicKey ? publicKey.toBase58() : web3AuthPublicKey}.${fileList.length > 0 ? fileList[0].name.split('.').pop() : ''}`
            }
        });
    }

    const page1 = () => {
        return(
            <div style={{ width: 'fit-content' }}>
                <div className="modal-header">
                    <button 
                        onClick={handleCloseModal}
                        style={{
                            position: 'absolute',
                            top: '2rem',
                            right: '2.5rem',
                            zIndex: 100,
                            backgroundColor: 'transparent',
                            color: 'white',
                            border: 'none',                               
                            fontSize: '2.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        x
                    </button>
                    <div className="login-header" />
                    <Image
                        src={Logo}
                        alt="logo"
                        className="logo"
                    />
                    <div className="header-text-container">
                        <p className="header-text">
                            Create a Buyer Profile
                        </p>
                        <p className="header-subtext">
                            Establish a buyer profile to access the marketplace and begin collecting.
                        </p>
                    </div>
                </div>
                <div className="profile">
                    <div className="profile__top-row">
                        <div className="profile__top-row__image-upload">
                            <ImgCrop rotationSlider>
                                <Upload
                                    action="https://run.mocky.io/v3/435e224c-44fb-4773-9faf-380c5e6a2188"
                                    listType="picture-card"
                                    fileList={fileList}
                                    onChange={onChange}
                                    onPreview={onPreview}
                                >
                                    {fileList.length < 1 && (
                                    <MdOutlineFileUpload style={{ fontSize: '2.5rem' }} />
                                    )}
                                </Upload>
                            </ImgCrop>
                            {fileList.length < 1 && <p className="p-4">Upload Profile Picture</p>}
                        </div>

                        <div className="profile__top-row__col">
                            <p className="caption-3">FULL NAME</p>
                            <Input 
                                className="profile__input-col__input"
                                size="large" 
                                value={profile!.fullName}
                                style={{ backgroundColor: '#1e1e22', color: 'white'}}
                                onChange={(e) => {setProfile({ ...profile!, fullName: e.target.value });}}
                            />
                            <p className="caption-3">USERNAME</p>
                            <Input 
                                size="large" 
                                placeholder="Enter Your Username"
                                value={profile!.userName}
                                style={{ backgroundColor: '#1e1e22', color: 'white'}}
                                onChange={(e) => {setProfile({ ...profile!, userName: e.target.value });}}
                            />
                            <p className="caption-3">EMAIL</p>
                            <Input
                                size="large"
                                placeholder="Enter Your Email"
                                type="email"
                                value={profile!.email}
                                style={{ backgroundColor: '#1e1e22', color: 'white'}}
                                onChange={(e) => {setProfile({ ...profile!, email: e.target.value });}}
                            />
                        </div>
                    </div>
                </div> 
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignContent: 'center', justifyContent: 'center', width: 'fit-content', margin: 'auto'}}>
                    {/* checkbox button that user has to click to acknowledge that they accept the terms and aggrements */}
                    <div className="terms-checkbox">
                        <input type="checkbox" id="terms" name="terms" value="terms" onChange={() => setAcceptedTerms(!acceptedTerms)} />{" "}
                        <label className="label-3" htmlFor="terms">I accept the <a href="/forms/termsandconditions" target='_blank'>terms and conditions</a></label>
                    </div>
                    {!creating && (
                        <button className="btn-primary" onClick={() => createProfile(publicKey ? publicKey!.toBase58() : web3AuthPublicKey!)} disabled={!acceptedTerms}>
                            Create Profile
                        </button>
                    )}
                </div>
            </div>
        )
    }

    const page2 = () => {
        const wrapperStyle = {
            width: 300,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusLG,
          };
        const retry = () => {
            
            console.log('retry')
        }
        return (
            <>
                <div className="modal-header">
                    {/* create an X to 'handleCloseModal' in the top right corner of the div and give it a z index so it stays on top of other ojects */}
                    <button 
                        onClick={handleCloseModal}
                        style={{
                            position: 'absolute',
                            top: '2rem',
                            right: '2.5rem',
                            zIndex: 100,
                            backgroundColor: 'transparent',
                            color: 'white',
                            border: 'none',                               
                            fontSize: '2.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        x
                    </button>
                    {/* <Image
                        src={LoginHeader}
                        alt="login header"
                        className="login-header"
                    /> */}
                    <div className="login-header" />
                    <Image
                        src={Logo}
                        alt="logo"
                        className="logo"
                    />
                    <div className="header-text-container">
                        <p className="header-text" style={{color: 'white'}}>
                            Verify your identity to invest
                        </p>
                        <p className="header-subtext" style={{color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center',
                            alignContent: 'center',
                            alignItems: 'center',
                            // center the text
                            textAlign: 'center',
                            lineHeight: '2rem',
                            height: 'fit-content',
                            fontSize: '1.5rem',
                        }}>
                            Every investor needs to fulfil KYC verification, this step is required to ensure compliance with financial regulations.
                        </p>
                        <br />
                        <p className="header-subtext" style={{color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center',
                            alignContent: 'center',
                            alignItems: 'center',
                            // center the text
                            textAlign: 'center',
                            lineHeight: '2rem',
                            height: 'fit-content',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            backgroundColor: '#325252',
                            padding: '1rem',
                            borderRadius: '10px',
                        }}>
                            Before starting: <br />
                            <span style={{fontSize: '1.25rem', fontWeight: 'normal'}}>
                                • Prepare Passport or ID card <br />
                                • Be in private room with a good lighting <br />
                            </span>

                            
                            <a href="https://ondato.com"><img src="https://ondato.com/logos/KYC-Compliance-Standard/OndatoKYCComplianceStandard_DarkBG.png" alt="Powered by Ondato" /></a>
                            
                        </p>
                    </div>
                </div>
            
                <button
                    className="btn-primary"
                    onClick={()=> handlePageChange(3)}
                >
                    Start Verification
                </button> 
                    
                <p className="header-subtext" style={{marginTop: '2rem', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    alignContent: 'center',
                    alignItems: 'center',
                    // center the text
                    textAlign: 'center',
                    lineHeight: '2rem',
                    height: 'fit-content',
                    fontSize: '.8rem',
                    fontWeight: 'bold'
                }}>
                    Personal information will be safely encrypted and only will be used for identity verification.
                </p>
                
            </>
        )
    }

    const page3 = () => {
        const wrapperStyle = {
            width: 300,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: token.borderRadiusLG,
          };
        const retry = () => {
            
            console.log('retry')
        }
        return (
            <>
                <div className="modal-header">
                    {/* create an X to 'handleCloseModal' in the top right corner of the div and give it a z index so it stays on top of other ojects */}
                    <button 
                        onClick={handleCloseModal}
                        style={{
                            position: 'absolute',
                            top: '2rem',
                            right: '2.5rem',
                            zIndex: 100,
                            backgroundColor: 'transparent',
                            color: 'white',
                            border: 'none',                               
                            fontSize: '2.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        x
                    </button>
                    {/* <Image
                        src={LoginHeader}
                        alt="login header"
                        className="login-header"
                    /> */}
                    <div className="login-header" />
                    <Image
                        src={Logo}
                        alt="logo"
                        className="logo"
                    />
                    <div className="header-text-container">
                        <p className="header-text" style={{color: 'white'}}>
                            Verify your identity to invest
                        </p>
                    </div>
                </div>
                <div 
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'column',
                        gap: '2rem',
                        padding: '2rem',

                    }}
                >
                    <div 
                        // className="profile__top-row"
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '2rem',
                            gap: '2rem',
                        //     alignContent: 'center'
                        }}
                    >
                        <div 
                            // className="profile__top-row__image-upload" 
                            style={wrapperStyle}
                        >
                            <p className="caption-3">Date of Birth</p>
                            {/* calendar picker that reports the date as 10-20-01 */}
                            <Calendar 
                                fullscreen={false}
                                value={profile!.dob !== '' ? dayjs(profile!.dob) : selectedValue} 
                                onSelect={onSelect} 
                                onPanelChange={onPanelChange} 
                                style={{ height: '20vh'}}
                            />
                        </div>

                        <div className="profile__top-row__col">
                            
                            <p className="caption-3">Building Number</p>
                            <Input 
                                size="large"
                                value={profile!.address.building_number}
                                placeholder='Building Number'
                                style={{ backgroundColor: '#1e1e22', color: 'white'}}
                                onChange={(e) => {setProfile({ ...profile, address: { ...profile!.address, building_number: e.target.value } });}}
                            />
                            <p className="caption-3">Street</p>
                            <Input 
                                size="large" 
                                value={profile!.address.street}
                                placeholder='Street Name'
                                style={{ backgroundColor: '#1e1e22', color: 'white'}}
                                onChange={(e) => {setProfile({ ...profile, address: { ...profile!.address, street: e.target.value } });}}
                            />
                            <p className="caption-3">Town</p>
                            <Input 
                                size="large" 
                                value={profile!.address.town}
                                placeholder='Town'
                                style={{ backgroundColor: '#1e1e22', color: 'white'}}
                                onChange={(e) => {setProfile({ ...profile, address: { ...profile!.address, town: e.target.value } });}}
                            />
                            <p className="caption-3">Postcode</p>
                            <Input 
                                size="large" 
                                value={profile!.address.postcode}
                                placeholder='Postcode'
                                style={{ backgroundColor: '#1e1e22', color: 'white'}}
                                onChange={(e) => {setProfile({ ...profile, address: { ...profile!.address, postcode: e.target.value } });}}
                            />
                            <p className="caption-3">Country</p>
                            <Select
                                defaultValue="CH"
                                style={{ width: 260 }}
                                onChange={handleChange}
                                options={countries}
                            />
                        </div>
                    </div>
                    {/* 
                    <button
                        className="btn-primary"
                        onClick={()=> handlePageChange(1)}
                    >
                        Go Back
                    </button> */}
                    <OndatoWrapper
                        publicKey={publicKey ? publicKey.toString() : web3AuthPublicKey!} 
                        handleSuccessPending={()=> setVerificationPending(true)}
                        handleRetry={()=> retry()}
                        fullName={profile!.fullName || ''}
                        dob={profile!.dob || ''}
                        address={{
                            ...profile!.address,
                            building_number: profile!.address.building_number || '',
                            street: profile!.address.street || '',
                            town: profile!.address.town || '',
                            postcode: profile!.address.postcode || '',
                            country: profile!.address.country || ''
                        }}
                        email=''
                        phoneNumber=''
                    />
                </div> 
                {/* {
                    !displayOnfido &&
                    profile!.fullName !== '' && profile!.fullName !== undefined &&
                    profile!.dob !== '' && profile!.dob !== undefined &&
                    profile!.address.building_number !== '' && profile!.address.building_number !== undefined &&
                    profile!.address.street !== '' && profile!.address.street !== undefined &&
                    profile!.address.town !== '' && profile!.address.town !== undefined &&
                    profile!.address.postcode !== '' && profile!.address.postcode !== undefined &&

                    (
                        <div className="login-container">
                            <button 
                                className="btn-primary"
                                onClick={()=> setDisplayOnfido(true)}
                            >
                                Verify Identity
                            </button>
                        </div>
                    )
                } */}
                
                        {

                        // <OnfidoWrapper 
                        //     publicKey={publicKey ? publicKey.toString() : web3AuthPublicKey!} 
                        //     handleSuccessPending={()=> setVerificationPending(true)}
                        //     handleRetry={()=> retry()}
                        //     fullName={profile!.fullName || ''}
                        //     dob={profile!.dob || ''}
                        //     address={{
                        //         ...profile!.address,
                        //         building_number: profile!.address.building_number || '',
                        //         street: profile!.address.street || '',
                        //         town: profile!.address.town || '',
                        //         postcode: profile!.address.postcode || '',
                        //         country: profile!.address.country || ''
                        //     }}
                        // />
                        
           
                    }
                </>
        )
    }

    // switch case for activePage
    const renderPage = (page: number) => {
        switch(page){
            case 1:
                return page1();
            case 2:
                return page2();
            case 3:
                return page3();
            default:
                return page1();
        }
    };

    useEffect(() => {
        if(publicKey){
            return;
        }
        checkLogin().then((res) => {
            if(res){
                if(res.account){
                    setWeb3AuthPublicKey(res.account);
                }
                if(res.rpc !== null){
                    setRpc(res.rpc);
                }
            }
        });
    }, []);

    return (
        <> 
            {isOpen && (
                <div className="modal-container">
                    {renderPage(activePage)}
                </div>
            )}
        </>
    );
};

export default ProfileModal;
