import React, { useState } from 'react';
import './Gallery.css';
import DOMPurify from 'dompurify';
import CancelIcon from "@mui/icons-material/Cancel";
import Button from "@mui/material/Button";

const Gallery = ({ history }) => {
  const [selectedImageData, setSelectedImageData] = useState(null);

  const handleImageClick = (item) => {
    setSelectedImageData(item.data);
  };

  return (
    <div className="history-container">
      {history && history.length > 0 && (
        <>
          <h2 style={{ color: "#fc323b" }}>Image History</h2>
          <div className="history-items">
            {history.map((item, index) => (
              <div
                key={index}
                className="history-item"
                onClick={() => handleImageClick(item)}
              >
                {item.imgUrl && (
                  <img
                    src={item.imgUrl}
                    alt={`History ${index}`}
                    className="history-image"
                  />
                )}
              </div>
            ))}
          </div>
          {selectedImageData && (
            <div className="image-data-display">
              <h3 style={{ color: "#fc323b" }}>Art's Analysis:</h3>
              {selectedImageData.response && (
                <div
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      selectedImageData.response
                        .replace(
                          /(?:\n|^) ?\*\*11\. Related YouTube Videos[\s\S]*$/g,
                          ""
                        )
                        .replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' target='_blank' rel='noopener noreferrer' style='color: #3a5bbf; '>$1</a>")
                        .replace(/---/g, "<hr style='border-top: 1px solid #fc323b; margin: 20px 0; font-weight: 800; font-size: 1.8em;'/>")
                        .replace(/\*\*(.*?)\*\*/g, "<strong style='color: #fc323b; font-weight: 600; font-size: 1.2em;'>$1</strong>")
                        .replace(/\*(.*?)\*/g, "<em>$1</em>")
                        .replace(/\n/g, "<br />")
                    ),
                  }}
                />
              )}
              <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
                <Button
                  className="button"
                  variant="outlined"
                  onClick={() => setSelectedImageData(null)}
                  startIcon={<CancelIcon />}
                  sx={{
                    fontSize: "16px",
                    fontWeight: "500",
                    color: "#fc323b",
                    borderColor: "#fc323b",
                    "&:hover": {
                      backgroundColor: "#fc323b",
                      borderColor: "#fc323b",
                      color: "#fff",
                    },
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Gallery;