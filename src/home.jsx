import React, { useState, useRef, useEffect } from "react";
import "./home.css";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ProgressBar from "@ramonak/react-progress-bar";
import CameraEnhanceIcon from "@mui/icons-material/CameraEnhance";
import CameraIcon from "@mui/icons-material/Camera";
import CancelIcon from "@mui/icons-material/Cancel";
import SendIcon from "@mui/icons-material/Send";
import LOGO from "./Assets/logo.png";
//youTube video
import DOMPurify from "dompurify";
import { ToastContainer, toast } from "react-toastify";
import Gallery from "./components/Gallery";
import TextToSpeech from "./TextToSpeech ";

const { GoogleGenerativeAI } = require("@google/generative-ai");
const Home = () => {
  const [imgUrl, setImgUrl] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [labels, setLabels] = useState([]);
  const fileInput = useRef();
  const videoRef = useRef();
  const canvasRef = useRef();
  const [isCapturing, setIsCapturing] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatResponse, setChatResponse] = useState("");
  const [responseTube, setResponseTube] = useState(""); // AI response
  const [videoIds, setVideoIds] = useState([]); // YouTube video IDs
  const [searchQuery, setSearchQuery] = useState(""); // YouTube search query
  const [loadingTube, setLoadingTube] = useState(false); // Loading state
  const fileInputRef = useRef(null); // Reference for file input
  const [history, setHistory] = useState([]);

  const extractVideoInfo = (markdown) => {
    const videoIdsMatch = markdown.match(/Video ID: `(.*?)`/g);
    const searchQueryMatch = markdown.match(/Search Query: "(.*?)"/);

    if (videoIdsMatch) {
      const ids = videoIdsMatch.map((match) => match.match(/`(.*?)`/)[1]);
      setVideoIds(ids); // 🔄 Updates videoIds state
    } else {
      setVideoIds([]);
    }

    if (searchQueryMatch) {
      setSearchQuery(searchQueryMatch[1]); // 🔄 Updates searchQuery state
    } else {
      setSearchQuery("");
    }
  };

  useEffect(() => {
    if (response) {
      extractVideoInfo(response);
      toast.success("AIzen finished Analyzing !!");
    }
  }, [response]);

  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
  });

  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadImage = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImgUrl(URL.createObjectURL(file));
      setImageFile(file);
      setUploadProgress(0);

      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 50);
    
    }
  };

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const cancelLivePhoto = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageUrl = canvas.toDataURL("image/png");
    setImgUrl(imageUrl);

    const blob = dataURLtoFile(imageUrl, "captured_image.png");
    setImageFile(blob);
    setLabels([]);
    cancelLivePhoto();
  };

  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(",");
    let mime = arr[0].match(/:(.*?);/)[1];
    let bstr = atob(arr[1]);
    let n = bstr.length;
    let u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

//   const analyzeImage = async (isChatbot = false) => {
//     if (!apiKey) {
//       setResponse(
//         "❌ REACT_APP_GEMINI_API_KEY is missing! Please check your .env file."
//       );
//       return;
//     }
//     if (!imageFile && !userInput && !isChatbot) {
//       setResponse("❌ Please upload an image to analyze.");
//       return;
//     }
//     if (!imageFile && userInput && isChatbot) {
//       setChatResponse(
//         "❌ Please upload an image first to ask questions about it."
//       );
//       return;
//     }

//     setLoading(true);
//     if (!isChatbot) {
//       setResponse("");
//     } else {
//       setChatResponse("");
//     }

//     let prompt = isChatbot
//       ? `You are Aizen, an AI partner for Art INTERPRETATOR and you are an expert art historian, battle strategist, and curator with access to a comprehensive art database. Answer the following question regarding the previously provided image.\n\nUser Question: ${userInput}\n\nAlbert's Response:`
//       : `
//       You are Aizen, an AI partner for Art INTERPRETATION and you are an expert art historian, battle strategist, and curator with access to a comprehensive art database. Your task is to analyze the provided artwork and/or query, delivering a detailed report in Markdown format, akin to a scholarly art historical analysis.

// **Report Structure:**

// ---

// **1. Identification and Verification:**

// * **Title:** {{Artwork Title or "Unknown"}}
// * **Artist:** {{Artist Name or "Unknown"}}
// * **Alternative Possibilities:** {{Other possible artists or titles}}
// * **Source Verification:** {{Cross-referenced sources or "Unavailable"}}

// ---

// **2. Detailed Analysis:**

// * Provide a comprehensive, paragraph-style explanation of the artwork's significance, themes, and interpretation.

// ---

// **3. Artist's Biography:**

// * **Name:** {{Artist Name}}
// * **Lifespan:** {{Born – Died}}
// * **Style:** {{Art Style}}
// * **Notable Works:** {{Examples}}
// * **Bio:** {{Brief summary}}

// ---

// **4. Historical Context:**

// * **Period:** {{Historical Period}}
// * **Events:** {{Key events}}
// * **Significance:** {{Cultural impact}}
// * **Location:** {{Where created or depicts}}

// ---

// **5. Visual Analysis:**

// * **Composition:** {{Arrangement of figures and objects}}
// * **Colors:** {{Dominant colors and mood}}
// * **Technique:** {{Brushwork and style}}
// * **Depiction of Subject:** {{How it’s portrayed}}

// ---

// **6. Artistic Interpretation:**

// * Describe the symbolism, themes, and intended message of the artwork in paragraph form.

// ---

// **7. Accuracy and Authenticity:**

// * **Accuracy:** {{How true to history}}
// * **Discrepancies:** {{Known inaccuracies}}

// ---

// **8. Additional Facts:**

// * **Trivia:** {{Interesting facts}}
// * **Influence:** {{Impact on art or artists}}

// ---

// **9. Current Location/Ownership:**

// * **Location:** {{Gallery, museum, or owner}}
// * **Acquisition:** {{How it was obtained}}

// ---

// **10. More References:**

// * Include a section called More References that contains links to art-related websites, including Wikipedia, and then provide the link. Structure the More References section like this, and use a point-wise list.

//     * **[Website Name]** : {{link}}
//     * **[Website Name]** : {{link}}
//     * **[Website Name]** : {{link}}

//     *Ensure that the Wikipedia link accurately points to the specific art piece.
//     *The link should be in link format so that while clicking it should open the particular page.
//     *Impotant One link is enough for each website and just website name is enough
// ---

// **11. Related YouTube Videos (If Valid IDs Found):**

// * **Search Query:** "{{Exact Artwork Title from Section 1}} analysis"
// * **Criteria:** Include ONLY videos related to Search Query. Omit irrelevant videos.
// * **Format:**
//     * Video ID: \`{{YouTube Video ID 1}}\`
//     * Video ID: \`{{YouTube Video ID 2}}\`
//     * Video ID: \`{{YouTube Video ID 3}}\`
// * **Condition:** If no valid IDs exist for the exact artwork title, OMIT this section entirely.

// ---

// **Considerations:**

// * Provide thorough research and analysis.
// * Use clear and precise language.
// * Back up your assertions with evidence.
// * Interpret the artwork within its historical and cultural context.
// * If the user asks a question, answer it within the relevant sections of the report.
// * *Instructions:*
//     * Provide as much detail as possible, including specific dates, names, and locations.
//     * Cite any sources you use to support your analysis.
//     * If the image is unclear or the artwork is difficult to identify, explain why and provide potential hypotheses.
//     * Prioritize factual accuracy.
//     * Maintain a consistent and detailed level of response.
//     * Use markdown formatting.
//     * Provide a compact answer, and do not ramble.
// * *Consistency:*
//     * Answer the same image the same way each time.
//     * Use a low temperature setting to decrease variance.
//     * ***Also very very very very important is to first describe it in a brief the link and then give the link.

// **User Input:** ${userInput}

// **Aizen's Response:**`;

//     try {
//       const parts = [];
//       if (imageFile) {
//         const reader = new FileReader();
//         reader.onloadend = async () => {
//           const base64Image = reader.result.split(",")[1];
//           const mimeType = imageFile.type;

//           parts.push({
//             inlineData: {
//               data: base64Image,
//               mimeType: mimeType,
//             },
//           });

//           if (userInput && isChatbot) {
//             // No need to add userInput again for chatbot, it's already in the prompt
//           } else if (userInput && !isChatbot) {
//             parts.push({ text: userInput });
//           }

//           setHistory((prevHistory) => [
//             ...prevHistory,
//             { imgUrl: imgUrl },
//           ]);

//           try {
//             const result = await model.generateContent({
//               contents: [{ parts: [{ text: prompt }, ...parts] }],
//               generationConfig,
//             });

//             const generatedText =
//               result.response?.text?.() || "No response received.";
//             if (isChatbot) {
//               setChatResponse(generatedText);
//             } else {
//               setResponse(generatedText);
//             }
//           } catch (error) {
//             console.error("API Error:", error.message);
//             if (isChatbot) {
//               setChatResponse(
//                 `❌ Error communicating with the API: ${error.message}`
//               );
//             } else {
//               setResponse(
//                 `❌ Error communicating with the API: ${error.message}`
//               );
//             }
//           } finally {
//             setLoading(false);
//           }
//         };
//         reader.readAsDataURL(imageFile);
//       } else if (userInput && !isChatbot) {
//         try {
//           const result = await model.generateContent({
//             contents: [{ parts: [{ text: prompt + userInput }] }],
//             generationConfig,
//           });

//           const generatedText =
//             result.response?.text?.() || "No response received.";
//           setResponse(generatedText);
//         } catch (error) {
//           console.error("API Error:", error.message);
//           setResponse(`❌ Error communicating with the API: ${error.message}`);
//         } finally {
//           setLoading(false);
//         }
//       }
//     } catch (error) {
//       console.error("API Error:", error.message);
//       if (isChatbot) {
//         setChatResponse(
//           `❌ Error communicating with the API: ${error.message}`
//         );
//       } else {
//         setResponse(`❌ Error communicating with the API: ${error.message}`);
//       }
//       setLoading(false);
//     }
//   };

const analyzeImage = async (isChatbot = false) => {
  if (!apiKey) {
    setResponse("❌ REACT_APP_GEMINI_API_KEY is missing! Please check your .env file.");
    return;
  }
  if (!imageFile && !userInput && !isChatbot) {
    setResponse("❌ Please upload an image to analyze.");
    return;
  }
  if (!imageFile && userInput && isChatbot) {
    setChatResponse("❌ Please upload an image first to ask questions about it.");
    return;
  }

  setLoading(true);
  if (!isChatbot) {
    setResponse("");
  } else {
    setChatResponse("");
  }

  let prompt = isChatbot
    ? `You are Aizen, an AI partner for Art INTERPRETATOR and you are an expert art historian, battle strategist, and curator with access to a comprehensive art database. Answer the following question regarding the previously provided image.\n\nUser Question: ${userInput}\n\nAlbert's Response:`
    : `
      You are Aizen, an AI partner for Art INTERPRETATION and you are an expert art historian, battle strategist, and curator with access to a comprehensive art database. Your task is to analyze the provided artwork and/or query, delivering a detailed report in Markdown format, akin to a scholarly art historical analysis.

**Report Structure:**

---

**1. Identification and Verification:**

* **Title:** {{Artwork Title or "Unknown"}}
* **Artist:** {{Artist Name or "Unknown"}}
* **Alternative Possibilities:** {{Other possible artists or titles}}
* **Source Verification:** {{Cross-referenced sources or "Unavailable"}}

---

**2. Detailed Analysis:**

* Provide a comprehensive, paragraph-style explanation of the artwork's significance, themes, and interpretation.

---

**3. Artist's Biography:**

* **Name:** {{Artist Name}}
* **Lifespan:** {{Born – Died}}
* **Style:** {{Art Style}}
* **Notable Works:** {{Examples}}
* **Bio:** {{Brief summary}}

---

**4. Historical Context:**

* **Period:** {{Historical Period}}
* **Events:** {{Key events}}
* **Significance:** {{Cultural impact}}
* **Location:** {{Where created or depicts}}

---

**5. Visual Analysis:**

* **Composition:** {{Arrangement of figures and objects}}
* **Colors:** {{Dominant colors and mood}}
* **Technique:** {{Brushwork and style}}
* **Depiction of Subject:** {{How it’s portrayed}}

---

**6. Artistic Interpretation:**

* Describe the symbolism, themes, and intended message of the artwork in paragraph form.

---

**7. Accuracy and Authenticity:**

* **Accuracy:** {{How true to history}}
* **Discrepancies:** {{Known inaccuracies}}

---

**8. Additional Facts:**

* **Trivia:** {{Interesting facts}}
* **Influence:** {{Impact on art or artists}}

---

**9. Current Location/Ownership:**

* **Location:** {{Gallery, museum, or owner}}
* **Acquisition:** {{How it was obtained}}

---

**10. More References:**

* Include a section called More References that contains links to art-related websites, including Wikipedia, and then provide the link. Structure the More References section like this, and use a point-wise list.

    * **[Website Name]** : {{link}}
    * **[Website Name]** : {{link}}
    * **[Website Name]** : {{link}}

    *Ensure that the Wikipedia link accurately points to the specific art piece.
    *The link should be in link format so that while clicking it should open the particular page.
    *Impotant One link is enough for each website and just website name is enough
---

**11. Related YouTube Videos (If Valid IDs Found):**

* **Search Query:** "{{Exact Artwork Title from Section 1}} analysis"
* **Criteria:** Include ONLY videos related to Search Query. Omit irrelevant videos.
* **Format:**
    * Video ID: \`{{YouTube Video ID 1}}\`
    * Video ID: \`{{YouTube Video ID 2}}\`
    * Video ID: \`{{YouTube Video ID 3}}\`
* **Condition:** If no valid IDs exist for the exact artwork title, OMIT this section entirely.

---

**Considerations:**

* Provide thorough research and analysis.
* Use clear and precise language.
* Back up your assertions with evidence.
* Interpret the artwork within its historical and cultural context.
* If the user asks a question, answer it within the relevant sections of the report.
* *Instructions:*
    * Provide as much detail as possible, including specific dates, names, and locations.
    * Cite any sources you use to support your analysis.
    * If the image is unclear or the artwork is difficult to identify, explain why and provide potential hypotheses.
    * Prioritize factual accuracy.
    * Maintain a consistent and detailed level of response.
    * Use markdown formatting.
    * Provide a compact answer, and do not ramble.
* *Consistency:*
    * Answer the same image the same way each time.
    * Use a low temperature setting to decrease variance.
    * ***Also very very very very important is to first describe it in a brief the link and then give the link.

**User Input:** ${userInput}

**Aizen's Response:**`;

  try {
    const parts = [];
    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result.split(",")[1];
        const mimeType = imageFile.type;

        parts.push({
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        });

        if (userInput && isChatbot) {
          // No need to add userInput again for chatbot, it's already in the prompt
        } else if (userInput && !isChatbot) {
          parts.push({ text: userInput });
        }

        try {
          const result = await model.generateContent({
            contents: [{ parts: [{ text: prompt }, ...parts] }],
            generationConfig,
          });

          const generatedText = result.response?.text?.() || "No response received.";
          if (isChatbot) {
            setChatResponse(generatedText);
          } else {
            setResponse(generatedText);
            setHistory((prevHistory) => [
              ...prevHistory,
              { imgUrl: imgUrl, data: { response: generatedText } },
            ]);
          }
        } catch (error) {
          console.error("API Error:", error.message);
          if (isChatbot) {
            setChatResponse(`❌ Error communicating with the API: ${error.message}`);
          } else {
            setResponse(`❌ Error communicating with the API: ${error.message}`);
          }
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(imageFile);
    } else if (userInput && !isChatbot) {
      try {
        const result = await model.generateContent({
          contents: [{ parts: [{ text: prompt + userInput }] }],
          generationConfig,
        });

        const generatedText = result.response?.text?.() || "No response received.";
        setResponse(generatedText);
        setHistory((prevHistory) => [
          ...prevHistory,
          { imgUrl: null, data: { response: generatedText } },
        ]);
      } catch (error) {
        console.error("API Error:", error.message);
        setResponse(`❌ Error communicating with the API: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  } catch (error) {
    console.error("API Error:", error.message);
    if (isChatbot) {
      setChatResponse(`❌ Error communicating with the API: ${error.message}`);
    } else {
      setResponse(`❌ Error communicating with the API: ${error.message}`);
    }
    setLoading(false);
  }
};
  const handleInputChange = (event) => {
    setUserInput(event.target.value);
  };
  return (
    <div className="App">
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" style={{ backgroundColor: "#fc323b" }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              <img style={{ width: "200px" }} src={LOGO} />
            </Typography>
            <Button color="inherit" variant="outlined">
              Login
            </Button>
          </Toolbar>
        </AppBar>
      </Box>
      <h1 className="TiltleArt">AIzen - Your AI Art Interpreter</h1>
      <div className="inputHolder">
        <form id="file-upload-form" className="uploader">
          <input
            id="file-upload"
            type="file"
            name="fileUpload"
            accept="image/*"
            onChange={uploadImage}
            ref={fileInput}
          />

          <label htmlFor="file-upload" id="file-drag">
            {imgUrl ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                }}
              >
                Image has been uploaded
                <ProgressBar
                  completed={uploadProgress}
                  bgColor="#fc323b"
                  height="15px"
                  width="80%"
                  margin="10px auto"
                  borderRadius="8px"
                  baseBgColor="#F0F8FF"
                  labelAlignment="center"
                  labelColor="#333"
                  labelSize="12px"
                  transitionDuration="0.5s"
                  transitionTimingFunction="ease"
                  animateOnRender={true}
                  initCompletedOnAnimation={0}
                />
              </div>
            ) : (
              <div id="start">
                <i className="fa fa-download" aria-hidden="true"></i>
                <div>Select a file or drag here</div>
                <div id="notimage" className="hidden">
                  Please select an image
                </div>
                <span id="file-upload-btn" className="btn btn-primary">
                  Select a file
                </span>
              </div>
            )}
            <div id="response" className="hidden">
              <div id="messages"></div>
              <progress className="progress" id="file-progress" value="0">
                <span>0</span>%
              </progress>
            </div>
          </label>
        </form>
        <span className="or" style={{ color: "white" }}>
          OR
        </span>
        <a class="btnbtn" onClick={startCamera}>
          <Button
            style={{
              color: "black",
              fontSize: "14px", // Increased font size
              fontWeight: "600", // Made it bolder (600 is semi-bold, 700 is bold)
            }}
            variant="none"
            startIcon={<CameraEnhanceIcon />}
          >
            Capture Live Photo
          </Button>
        </a>
      </div>

      <div className="mainWrapper">
        <div className="mainContent">
          {isCapturing && (
            <div className="videoContainer">
              <video ref={videoRef} autoPlay className="videoFeed"></video>
              <div className="videoconatinerbuttn">
                <Button
                  className="button"
                  variant="outlined"
                  onClick={capturePhoto}
                  startIcon={<CameraIcon />}
                  sx={{
                    fontSize: "16px",
                    fontWeight: "500",
                    color: "#fc323b", // Set text color to red
                    borderColor: "#fc323b", // Set border color to red
                    "&:hover": {
                      backgroundColor: "#fc323b",
                      borderColor: "#fc323b",
                      color: "#fff", // Change text color to white on hover
                    },
                  }}
                >
                  Capture
                </Button>
                <Button
                  className="button"
                  variant="outlined"
                  onClick={cancelLivePhoto}
                  startIcon={<CancelIcon />}
                  sx={{
                    fontSize: "16px",
                    fontWeight: "500",
                    color: "#fc323b", // Set text color to red
                    borderColor: "#fc323b", // Set border color to red
                    "&:hover": {
                      backgroundColor: "#fc323b",
                      borderColor: "#fc323b",
                      color: "#fff", // Change text color to white on hover
                    },
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="imageholder">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexDirection: "column",
                justifyContent: "space-evenly",
              }}
            >
              {imgUrl && (
                <img src={imgUrl} alt="Uploaded Preview" className="Img" />
              )}

              {imgUrl && (
                <a
                  class="btnbtn"
                  style={{ width: "8em", height: "2.5em" }}
                  onClick={() => analyzeImage(false)}
                >
                  <Button
                    sx={{
                      border: "none",
                      marginBottom: "10px",
                      color: "black",
                      fontWeight: "600",
                    }}
                    variant="outlined"
                    className="analyzeButton button"
                  >
                    {loading && response === ""
                      ? "Analyzing..."
                      : "Analyze Image"}
                  </Button>
                </a>
              )}
            </div>
            {imgUrl && (
              <div className="chatbot-search-container">
                <h2 style={{ color: "#fff" }}>Ask Aizen !</h2>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "10px",
                    width: "550px",
                  }}
                >
                  <textarea
                    placeholder="Ask AI a question regarding portrait..."
                    value={userInput}
                    onChange={handleInputChange}
                    className="chatbot-search-box"
                  />
                  <Button
                    sx={{
                      fontSize: "16px",
                      fontWeight: "500",
                      color: "#fc323b", // Set text color to red
                      borderColor: "#fc323b", // Set border color to red
                      "&:hover": {
                        backgroundColor: "#fc323b",
                        borderColor: "#fc323b",
                        color: "#fff", // Change text color to white on hover
                      },
                    }}
                    variant="outlined"
                    className="analyzeButton button"
                    endIcon={!loading ? <SendIcon /> : null}
                    onClick={() => analyzeImage(true)}
                  >
                    {loading && chatResponse === "" ? "Loading..." : "Ask"}
                  </Button>
                </div>
                {chatResponse && (
                  <div className="chat-response-section">
                    <pre>{chatResponse}</pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {labels.length > 0 && (
            <div className="analysisResults">
              <h2>Analysis Results:</h2>
              <ul>
                {labels.map((labelObj, index) => (
                  <li key={index}>
                    {labelObj.label} ({(labelObj.score * 100).toFixed(2)}%)
                  </li>
                ))}
              </ul>
            </div>
          )}
          {response && (
            <div
              style={{
                padding: "20px",
                backgroundColor: "#1C1D24",
                borderRadius: "8px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
                color: "white",
                lineHeight: "1.6",
              }}
            >
              <h2
                style={{
                  textAlign: "center",
                  marginBottom: "20px",
                  color: "#fc323b",
                  fontWeight: "bold",
                }}
              >
                AIzen's Art Analysis
              </h2>

              <div
                style={{
                  wordWrap: "break-word",
                  color: "white",
                  fontFamily: "sans-serif",
                  lineHeight: "1.6",
                }}
                dangerouslySetInnerHTML={{
                  __html: response
                    .replace(
                      /(?:\n|^) ?\*\*11\. Related YouTube Videos[\s\S]*$/g,
                      ""
                    ) 
                   
                    .replace(
                      /\[(.*?)\]\((.*?)\)/g,
                      "<a href='$2' target='_blank' rel='noopener noreferrer' style='color: #3a5bbf; '>$1</a>"
                    )
                    // Improved regex to hide section 11+
                    // Makes links clickable and opens in a new tab
                    .replace(
                      /---/g,
                      "<hr style='border-top: 1px solid #fc323b; margin: 20px 0; font-weight: 800; font-size: 1.8em;'/>"
                    )
                    .replace(
                      /\*\*(.*?)\*\*/g,
                      "<strong style='color: #fc323b; font-weight: 600; font-size: 1.2em;'>$1</strong>"
                    )
                    .replace(/\*(.*?)\*/g, "<em>$1</em>")
                    .replace(/\n/g, "<br />"),
                    
                }}
              />
            </div>
          )}
           <TextToSpeech response={response}/>
          {videoIds.length > 0 && (
            <div style={{ marginTop: "30px" }}>
              <h2
                style={{
                  textAlign: "center",
                  marginBottom: "20px",
                  color: "#fc323b",
                  fontWeight: "bold",
                }}
              >
                Related YouTube Videos
              </h2>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "25px",
                }}
              >
                {videoIds.map((id, index) => (
                  <iframe
                    key={index}
                    width="400"
                    height="225"
                    src={`https://www.youtube.com/embed/${id}`}
                    title={`YouTube video ${index + 1}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{
                      borderRadius: "8px",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
                    }}
                  ></iframe>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Gallery history={history}/>
      <ToastContainer />
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
     
    </div>
  );
};

export default Home;
