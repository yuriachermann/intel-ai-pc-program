import React, { useCallback, useEffect, useRef, useState } from "react";
import "aos/dist/aos.css";
import Layout from "../components/layout/Layout";
import { Formik, Form, Field } from "formik";
import axios from "axios";
import Image from "next/image";
import { api } from "~/utils/api";
import { QueryClient } from "@tanstack/query-core";
import { createId } from "@paralleldrive/cuid2";
import Webcam from "react-webcam";
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import router from "next/router";
import AudioRecorder from "./audio_recorder";

const steps = ['Name', 'Order Details', 'Photo'];


function Ordering() {


  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [webcamImage, setWebcamImage] = React.useState<File | null>(null);
  const [processedImage, setProcessedImage] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [streetImageID, setStreetImageID] = React.useState(createId());

  const inputFileRef = React.useRef<HTMLInputElement>(null);

  const webcamRef = React.useRef<any>(null);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        // Convert base64 to Blob
        fetch(imageSrc)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], "webcam-screenshot.jpg", {
              type: "image/jpeg",
            });
            setSelectedFile(file); // or another state variable
          });
      }
    }
  }, [webcamRef]);

  useEffect(() => {
    const handleDetect = async () => {
      setLoading(true);
      const formData = new FormData();
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      try {
        const response = await axios.post(
          `http://localhost:5002/predict?street_image_id=${streetImageID}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setProcessedImage(response.data);
        console.log(response);
      } catch (error) {
        console.error("Error:", error);
        alert("Failed to upload the file");
      } finally {
        setLoading(false); // Set loading state back to false
      }
    };

    // Call handleDetect whenever streetImageID changes
    if (selectedFile && streetImageID) {
      handleDetect();
    }
  }, [streetImageID]);

  const onDetectClick = async () => {
    if (selectedFile) {
      await setStreetImageID(createId());
    } else {
      alert("Please select an image to process");
    }
  };

  const FACING_MODE_USER = "user";
  const FACING_MODE_ENVIRONMENT = "environment";

  const videoConstraints = {
    facingMode: FACING_MODE_USER,
  };




  const [activeStep, setActiveStep] = React.useState(0);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const handleOrder = () => {
    const arg1 = 'value1';
    const arg2 = 'value2';

    // Redirect to the '/flying' route with query parameters
    router.push({
      pathname: '/flying',
      query: { arg1, arg2 },
    });
  };

  return (
    <Layout>
      <main className="grow">
        <div className="ml-40 mt-6">
          <div className="m-0 text-[17px] font-bold text-slate-100">
            Place order
          </div>
          <div className="mb-5 mt-[10px] text-[15px] leading-normal text-slate-100">
            Here you will provide your name and food preferences and we will
            select a surprise meal for you based on that
          </div>
        </div>
        <Box className="mx-40 mt-6 text-slate-100">
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => {
              const stepProps: { completed?: boolean } = {};
              const labelProps: {
                optional?: React.ReactNode;
              } = {};
              return (
                <Step key={label} {...stepProps}>
                  <StepLabel {...labelProps} sx={{ 
                    '& .MuiStepLabel-label': { 
                      color: 'white',
                      '& .MuiStepIcon-root': {
                        color: 'white' // Change this to your desired icon color
                      } // Change this to your desired color
                    } 
                  }}>
                    {label}
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
          {activeStep === 0 && (
            <React.Fragment>
              {/* <Typography sx={{ mt: 2, mb: 1 }}>Step {activeStep + 1}</Typography> */}
              <Box sx={{ mt: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Your Name"
                  variant="outlined"
                  InputLabelProps={{
                    style: { color: 'black' },
                  }}
                  InputProps={{
                    style: { color: 'black' },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'black',
                      },
                      '&:hover fieldset': {
                        borderColor: 'black',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'black',
                      },
                    },
                  }}
                />
              </Box>
              <Box className="w-[78%] flex absolute bottom-[63px]">
                <Button
                  color="inherit"
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Back
                </Button>
                <Box sx={{ flex: '1 1 auto' }} />
                <Button onClick={handleNext}>
                  {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                </Button>
              </Box>
            </React.Fragment>
          )}
          {activeStep === 1 && (
            <React.Fragment>
              {/* <Typography sx={{ mt: 2, mb: 1 }}>Step {activeStep + 1}</Typography> */}
              <AudioRecorder />
              <Box className="w-[78%] flex absolute bottom-[63px]">
                <Button
                  color="inherit"
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Back
                </Button>
                <Box sx={{ flex: '1 1 auto' }} />
                <Button onClick={handleNext}>
                  {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                </Button>
              </Box>
            </React.Fragment>
          )}
          {activeStep === steps.length - 1 && (
            <React.Fragment>
              {/* <Typography sx={{ mt: 2, mb: 1 }}>Step {activeStep + 1}</Typography> */}
              <div className="flex w-full justify-center">
                <div className="mt-[10px] max-h-sm min-h-[290px] min-w-[380px] max-w-sm border-2 border-slate-800">
                  {selectedFile ? (
                    <Image
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      width={500}
                      height={300}
                      className="h-80 w-full object-cover"
                    />
                  ) : webcamImage ? (
                    <Image
                      src={URL.createObjectURL(webcamImage)}
                      alt="Preview"
                      width={500}
                      height={300}
                      className="h-80 w-full object-cover"
                    />
                  ) : (
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{
                        ...videoConstraints,
                        facingMode: FACING_MODE_ENVIRONMENT,
                      }}
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    ref={inputFileRef}
                    onChange={(event) => {
                      setSelectedFile(event.target.files?.[0] || null);
                    }}
                  />
                </div>
              </div>
              <Box className="w-[78%] flex absolute bottom-[63px]">
                <Button
                  color="inherit"
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Back
                </Button>
                <Box sx={{ flex: '1 1 auto' }} />
                <Button onClick={handleNext}>
                  {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                </Button>
              </Box>
            </React.Fragment>
          )}
          {activeStep === steps.length && (
            <React.Fragment>
              <div className="flex w-full justify-center">
              <Typography sx={{ mt: 2, mb: 1 }}>
                All steps completed - you&apos;ve ordered your meal
              </Typography>
              </div>
              <Box className="w-[78%] flex absolute bottom-[63px]">
                <Button
                  color="inherit"
                  onClick={handleReset}
                  sx={{ mr: 1 }}
                >
                  Reset
                </Button>
                <Box sx={{ flex: '1 1 auto' }} />
                <Button onClick={handleOrder}>Order</Button>
              </Box>
            </React.Fragment>
          )}
        </Box>
        
      </main>
    </Layout>
  );
}

export default Ordering;
