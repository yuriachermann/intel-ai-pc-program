import React, { useCallback, useEffect } from "react";
import "aos/dist/aos.css";
import Layout from "../components/layout/Layout";
import axios from "axios";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import { createId } from "@paralleldrive/cuid2";
import { useRouter } from "next/router";

function Flying() {
  const router = useRouter();
  const routeUser: string | undefined = Array.isArray(router.query.user)
    ? router.query.user[0]
    : router.query.user;
  const routeFood: string | undefined = Array.isArray(router.query.dish)
    ? router.query.dish[0]
    : router.query.dish;
  const routeOrderID: string | undefined = Array.isArray(router.query.orderID)
    ? router.query.orderID[0]
    : router.query.orderID;
  const routeCity: string | undefined = Array.isArray(router.query.city)
    ? router.query.city[0]
    : router.query.city;

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
  
  const handleBack = () => {
    router.push({
      pathname: '/ordering',
    });
  };

  const handleReceive = () => {
    const arg1 = 'value1';
    const arg2 = 'value2';

    router.push({
      pathname: '/delivery',
      query: { arg1, arg2 },
    });
  };

  return (
    <Layout>
      <main className="grow">
          <div className="ml-40 mt-6">
            <div className="m-0 text-[17px] font-bold text-white">Flying</div>
            <div className="mb-5 mt-[10px] text-[15px] leading-normal text-slate-100">
              Experimenting with some autonomous flight features
            </div>
          </div>
          
          <Box className="w-[78%] flex absolute bottom-[63px] mx-40">
            <Button
              color="inherit"
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button onClick={handleReceive}>Receive</Button>
          </Box>
      </main>
    </Layout>
  );
}

export default Flying;
