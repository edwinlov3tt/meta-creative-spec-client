import React from 'react';
import type { PreviewAdData } from '@/types/previews';

interface InstagramExplorePreviewProps {
  adData: PreviewAdData;
}

export const InstagramExplorePreview: React.FC<InstagramExplorePreviewProps> = ({
  adData,
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      <div
        style={{
          color: 'rgb(28, 30, 33)',
          fontSize: '12px',
          height: '100%',
          maxHeight: '100%',
          lineHeight: '16px',
          overflowX: 'hidden',
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
          backgroundColor: 'rgb(255, 255, 255)',
        }}
      >
          <div style={{ height: '564px', overflow: 'hidden', width: '320px' }}>
            <div
              style={{
                flexWrap: 'wrap',
                height: '566px',
                justifyContent: 'space-between',
                width: '320px',
                display: 'flex',
              }}
            >
              {/* Column 1 - Single tall tile */}
              <div
                style={{
                  backgroundColor: 'rgb(242, 242, 242)',
                  height: '174px',
                  marginBottom: '2px',
                  position: 'relative',
                  width: '106px',
                }}
              />

              {/* Column 2 - Two tiles */}
              <div style={{ height: '176px', width: '106px' }}>
                <div
                  style={{
                    backgroundColor: 'rgb(242, 242, 242)',
                    height: '68px',
                    marginBottom: '2px',
                    position: 'relative',
                    width: '106px',
                  }}
                />
                <div
                  style={{
                    backgroundColor: 'rgb(242, 242, 242)',
                    height: '106px',
                    marginBottom: '2px',
                    position: 'relative',
                    width: '106px',
                  }}
                />
              </div>

              {/* Column 3 - Two tiles */}
              <div style={{ height: '176px', width: '106px' }}>
                <div
                  style={{
                    backgroundColor: 'rgb(242, 242, 242)',
                    height: '68px',
                    marginBottom: '2px',
                    position: 'relative',
                    width: '106px',
                  }}
                />
                <div
                  style={{
                    backgroundColor: 'rgb(242, 242, 242)',
                    height: '106px',
                    marginBottom: '2px',
                    position: 'relative',
                    width: '106px',
                  }}
                />
              </div>

              {/* Column 4 - Two tiles (placeholder) */}
              <div style={{ height: '214px', width: '106px' }}>
                <div
                  style={{
                    backgroundColor: 'rgb(242, 242, 242)',
                    height: '106px',
                    marginBottom: '2px',
                    position: 'relative',
                    width: '106px',
                  }}
                />
                <div
                  style={{
                    backgroundColor: 'rgb(242, 242, 242)',
                    height: '106px',
                    marginBottom: '2px',
                    position: 'relative',
                    width: '106px',
                  }}
                />
              </div>

              {/* Column 5 - Two tiles (AD TILE is first) */}
              <div style={{ height: '214px', width: '106px' }}>
                {/* AD TILE */}
                <div
                  style={{
                    backgroundColor: 'rgb(242, 242, 242)',
                    height: '106px',
                    marginBottom: '2px',
                    position: 'relative',
                    width: '106px',
                  }}
                >
                  {/* Ad Image */}
                  <div
                    style={{
                      height: '106px',
                      overflow: 'hidden',
                      position: 'relative',
                      width: '106px',
                      display: 'inline-block',
                    }}
                  >
                    {adData.creativeImage ? (
                      <img
                        src={adData.creativeImage}
                        alt="Ad creative"
                        style={{
                          height: '100%',
                          objectFit: 'cover',
                          position: 'absolute',
                          width: '100%',
                          zIndex: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          height: '100%',
                          width: '100%',
                          backgroundColor: 'rgb(218, 220, 222)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span style={{ fontSize: '10px', color: 'rgb(160, 160, 160)' }}>1:1</span>
                      </div>
                    )}
                  </div>

                  {/* Gradient overlay */}
                  <div
                    style={{
                      backgroundImage: 'linear-gradient(0deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.4))',
                      bottom: '24px',
                      height: '84px',
                      position: 'absolute',
                      width: '100%',
                    }}
                  />

                  {/* Content overlay */}
                  <div
                    style={{
                      flexDirection: 'column',
                      height: '100%',
                      position: 'absolute',
                      width: '100%',
                      display: 'flex',
                      top: 0,
                      left: 0,
                    }}
                  >
                    {/* Sponsored tag - top right */}
                    <div
                      style={{
                        height: '18px',
                        justifyContent: 'flex-end',
                        width: '100%',
                        display: 'flex',
                      }}
                    >
                      <div style={{ height: '18px', width: '72px' }}>
                        <div style={{ height: '16px', width: '72px' }}>
                          <div
                            style={{
                              color: 'rgb(255, 255, 255)',
                              fontWeight: 500,
                              height: '16px',
                              marginLeft: '2px',
                              marginRight: '2px',
                              marginTop: '6px',
                              paddingLeft: '6px',
                              paddingRight: '6px',
                              width: '58px',
                            }}
                          >
                            Sponsored
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Profile image - bottom left */}
                    <div
                      style={{
                        height: '40px',
                        justifyContent: 'flex-start',
                        marginTop: 'auto',
                        width: '40px',
                        display: 'flex',
                      }}
                    >
                      <div style={{ height: '40px', width: '36px' }}>
                        {adData.profileImage ? (
                          <img
                            src={adData.profileImage}
                            alt={adData.brandName}
                            style={{
                              height: '24px',
                              width: '24px',
                              marginLeft: '6px',
                              marginRight: '6px',
                              marginTop: '10px',
                              borderRadius: '24px',
                              overflow: 'clip',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              height: '24px',
                              width: '24px',
                              marginLeft: '6px',
                              marginRight: '6px',
                              marginTop: '10px',
                              borderRadius: '24px',
                              backgroundColor: 'rgb(218, 220, 222)',
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Second tile in this column */}
                <div
                  style={{
                    backgroundColor: 'rgb(242, 242, 242)',
                    height: '106px',
                    marginBottom: '2px',
                    position: 'relative',
                    width: '106px',
                  }}
                />
              </div>

              {/* Column 6 - Two tiles */}
              <div style={{ height: '214px', width: '106px' }}>
                <div
                  style={{
                    backgroundColor: 'rgb(242, 242, 242)',
                    height: '106px',
                    marginBottom: '2px',
                    position: 'relative',
                    width: '106px',
                  }}
                />
                <div
                  style={{
                    backgroundColor: 'rgb(242, 242, 242)',
                    height: '106px',
                    marginBottom: '2px',
                    position: 'relative',
                    width: '106px',
                  }}
                />
              </div>

              {/* Column 7 - Single tall tile */}
              <div
                style={{
                  backgroundColor: 'rgb(242, 242, 242)',
                  height: '174px',
                  marginBottom: '2px',
                  position: 'relative',
                  width: '106px',
                }}
              />

              {/* Column 8 - Two tiles */}
              <div style={{ height: '176px', width: '106px' }}>
                <div
                  style={{
                    backgroundColor: 'rgb(242, 242, 242)',
                    height: '106px',
                    marginBottom: '2px',
                    position: 'relative',
                    width: '106px',
                  }}
                />
                <div
                  style={{
                    backgroundColor: 'rgb(242, 242, 242)',
                    height: '68px',
                    marginBottom: '2px',
                    position: 'relative',
                    width: '106px',
                  }}
                />
              </div>

              {/* Column 9 - Two tiles */}
              <div style={{ height: '176px', width: '106px' }}>
                <div
                  style={{
                    backgroundColor: 'rgb(242, 242, 242)',
                    height: '106px',
                    marginBottom: '2px',
                    position: 'relative',
                    width: '106px',
                  }}
                />
                <div
                  style={{
                    backgroundColor: 'rgb(242, 242, 242)',
                    height: '68px',
                    marginBottom: '2px',
                    position: 'relative',
                    width: '106px',
                  }}
                />
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};
