import React, { useState } from 'react';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import type { PreviewAdData } from '@/types/previews';

interface MetaMessengerPreviewProps {
  adData: PreviewAdData;
}

export const MetaMessengerPreview: React.FC<MetaMessengerPreviewProps> = ({
  adData,
}) => {
  const [view, setView] = useState<'ad' | 'expanded'>('ad');

  // Truncate text helper
  const truncateText = (text: string, limit: number) => {
    if (!text || text.length <= limit) return text;
    return text.substring(0, limit);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      <div
        className="bg-white"
        style={{
          width: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
          fontSize: '12px',
          lineHeight: '16px',
          color: 'rgb(28, 30, 33)',
        }}
      >
          {/* Toggle Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '28px',
              marginBottom: '16px',
              marginLeft: '94px',
              marginRight: '94px',
              width: '190px',
            }}
          >
            <button
              onClick={() => setView('ad')}
              style={{
                backgroundColor: view === 'ad' ? 'rgb(24, 119, 242)' : 'rgb(245, 246, 247)',
                borderTopLeftRadius: '2px',
                borderBottomLeftRadius: '2px',
                boxSizing: 'border-box',
                color: view === 'ad' ? 'rgb(255, 255, 255)' : 'rgb(68, 73, 80)',
                cursor: 'pointer',
                fontWeight: 700,
                height: '28px',
                lineHeight: '26px',
                paddingLeft: '12px',
                paddingRight: '12px',
                textAlign: 'center',
                width: '72px',
                borderWidth: '2px',
                borderColor: view === 'ad' ? 'rgb(24, 119, 242)' : 'rgb(218, 221, 225)',
                borderStyle: 'solid',
                whiteSpace: 'nowrap',
              }}
            >
              Ad view
            </button>
            <button
              onClick={() => setView('expanded')}
              style={{
                backgroundColor: view === 'expanded' ? 'rgb(24, 119, 242)' : 'rgb(245, 246, 247)',
                borderTopRightRadius: '2px',
                borderBottomRightRadius: '2px',
                boxSizing: 'border-box',
                color: view === 'expanded' ? 'rgb(255, 255, 255)' : 'rgb(68, 73, 80)',
                cursor: 'pointer',
                fontWeight: 700,
                height: '28px',
                lineHeight: '26px',
                paddingLeft: '12px',
                paddingRight: '12px',
                textAlign: 'center',
                width: '114px',
                borderWidth: '2px',
                borderColor: view === 'expanded' ? 'rgb(24, 119, 242)' : 'rgb(218, 221, 225)',
                borderStyle: 'solid',
                whiteSpace: 'nowrap',
              }}
            >
              Expanded view
            </button>
          </div>

          {view === 'ad' ? (
            // Ad View
            <div>
              {/* Top divider */}
              <div
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  height: '2px',
                  width: '376px',
                }}
              />

              {/* Main content */}
              <div
                style={{
                  display: 'flex',
                  height: '76px',
                  paddingLeft: '20px',
                  paddingRight: '20px',
                }}
              >
                {/* Profile Image */}
                <div style={{ width: '60px', height: '76px' }}>
                  {adData.profileImage ? (
                    <img
                      src={adData.profileImage}
                      alt={adData.brandName}
                      style={{
                        height: '60px',
                        width: '60px',
                        marginTop: '8px',
                        borderRadius: '30px',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: '60px',
                        width: '60px',
                        marginTop: '8px',
                        borderRadius: '30px',
                        backgroundColor: 'rgb(218, 220, 222)',
                      }}
                    />
                  )}
                </div>

                {/* Text Content */}
                <div
                  style={{
                    marginLeft: '12px',
                    marginRight: '12px',
                    marginTop: '10px',
                    marginBottom: '8px',
                    width: '192px',
                  }}
                >
                  {/* Brand Name and Ad Badge */}
                  <div style={{ display: 'flex', height: '20px', width: '192px' }}>
                    <h2
                      style={{
                        fontSize: '18px',
                        fontWeight: 600,
                        height: '20px',
                        lineHeight: '20px',
                        maxWidth: '170px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        paddingTop: '2px',
                        WebkitLineClamp: 1,
                      }}
                    >
                      {truncateText(adData.brandName, 25)}
                    </h2>
                    <div
                      style={{
                        backgroundColor: 'rgb(218, 220, 222)',
                        height: '18px',
                        width: '22px',
                        marginLeft: '4px',
                        marginTop: '2px',
                        marginBottom: '2px',
                        borderRadius: '4px',
                      }}
                    >
                      <div
                        style={{
                          color: 'rgb(255, 255, 255)',
                          fontSize: '10px',
                          height: '18px',
                          marginLeft: '4px',
                          marginRight: '4px',
                          marginTop: '2px',
                          textAlign: 'center',
                          width: '14px',
                        }}
                      >
                        Ad
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p
                    style={{
                      color: 'rgba(0, 0, 0, 0.5)',
                      fontSize: '14px',
                      height: '18px',
                      lineHeight: '18px',
                      maxHeight: '18px',
                      paddingTop: '2px',
                      textOverflow: 'ellipsis',
                      width: '192px',
                      overflow: 'hidden',
                      WebkitLineClamp: 1,
                    }}
                  >
                    {truncateText(adData.description, 60)}
                  </p>

                  {/* View more link */}
                  <div
                    style={{
                      color: 'rgb(31, 135, 255)',
                      fontSize: '14px',
                      height: '18px',
                      lineHeight: '18px',
                      width: '192px',
                    }}
                  >
                    View more
                  </div>
                </div>

                {/* Thumbnail Image */}
                <div
                  style={{
                    display: 'flex',
                    height: '60px',
                    width: '60px',
                    marginTop: '8px',
                    marginBottom: '8px',
                    marginLeft: '2px',
                    position: 'relative',
                  }}
                >
                  {adData.creativeImage ? (
                    <img
                      src={adData.creativeImage}
                      alt="Ad creative"
                      style={{
                        alignSelf: 'center',
                        height: '60px',
                        width: '60px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        position: 'relative',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: '60px',
                        width: '60px',
                        backgroundColor: 'rgb(218, 220, 222)',
                        borderRadius: '12px',
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Bottom divider */}
              <div
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  height: '2px',
                  width: '376px',
                }}
              />
            </div>
          ) : (
            // Expanded View
            <div>
              {/* Top divider */}
              <div
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  height: '2px',
                  width: '376px',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '720px',
                  paddingTop: '12px',
                  paddingBottom: '10px',
                }}
              >
                {/* Header with back button, profile, and menu */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '376px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      height: '72px',
                      marginLeft: '20px',
                      marginRight: '8px',
                      marginTop: '16px',
                      width: '376px',
                    }}
                  >
                    <ChevronLeft
                      style={{
                        height: '24px',
                        width: '24px',
                        color: 'rgb(28, 30, 33)',
                      }}
                    />
                    {adData.profileImage ? (
                      <img
                        src={adData.profileImage}
                        alt={adData.brandName}
                        style={{
                          height: '60px',
                          width: '60px',
                          marginLeft: '114px',
                          marginRight: '114px',
                          marginTop: '-8px',
                          marginBottom: '12px',
                          borderRadius: '30px',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          height: '60px',
                          width: '60px',
                          marginLeft: '114px',
                          marginRight: '114px',
                          marginTop: '-8px',
                          marginBottom: '12px',
                          borderRadius: '30px',
                          backgroundColor: 'rgb(218, 220, 222)',
                        }}
                      />
                    )}
                    <MoreHorizontal
                      style={{
                        height: '24px',
                        width: '24px',
                        color: 'rgb(28, 30, 33)',
                      }}
                    />
                  </div>

                  {/* Brand Name and Ad Badge */}
                  <div
                    style={{
                      display: 'flex',
                      height: '20px',
                      maxWidth: '344px',
                      marginLeft: '92px',
                      marginRight: '92px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        height: '20px',
                        lineHeight: '20px',
                        overflow: 'hidden',
                        textAlign: 'center',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {truncateText(adData.brandName, 25)}
                    </div>
                    <div
                      style={{
                        height: '16px',
                        width: '24px',
                        marginLeft: '6px',
                        marginTop: '2px',
                        marginBottom: '4px',
                        borderRadius: '4px',
                      }}
                    >
                      <div
                        style={{
                          color: 'rgb(255, 255, 255)',
                          fontSize: '10px',
                          height: '18px',
                          marginLeft: '4px',
                          marginRight: '4px',
                          marginTop: '2px',
                          textAlign: 'center',
                          width: '16px',
                        }}
                      >
                        Ad
                      </div>
                    </div>
                  </div>

                  {/* Like count */}
                  <div
                    style={{
                      color: 'rgba(0, 0, 0, 0.5)',
                      fontSize: '16px',
                      height: '20px',
                      lineHeight: '20px',
                      marginLeft: '66px',
                      marginRight: '66px',
                      marginTop: '2px',
                      maxWidth: '344px',
                      overflow: 'hidden',
                      textAlign: 'center',
                    }}
                  >
                    615 people like {adData.brandName}
                  </div>
                </div>

                {/* Primary Text */}
                <div
                  style={{
                    fontSize: '18px',
                    lineHeight: '22px',
                    marginLeft: '16px',
                    marginRight: '16px',
                    marginTop: '8px',
                    maxHeight: '66px',
                    overflow: 'hidden',
                    WebkitLineClamp: 3,
                  }}
                >
                  {adData.primaryText}
                </div>

                {/* Image and Card */}
                <div
                  style={{
                    display: 'flex',
                    marginLeft: '16px',
                    marginRight: '16px',
                    marginTop: '12px',
                    width: '344px',
                  }}
                >
                  <div style={{ width: '344px' }}>
                    {/* Creative Image */}
                    {adData.creativeImage ? (
                      <img
                        src={adData.creativeImage}
                        alt="Ad creative"
                        style={{
                          borderTopLeftRadius: '18px',
                          borderTopRightRadius: '18px',
                          height: '344px',
                          width: '344px',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          borderTopLeftRadius: '18px',
                          borderTopRightRadius: '18px',
                          height: '344px',
                          width: '344px',
                          backgroundColor: 'rgb(218, 220, 222)',
                        }}
                      />
                    )}

                    {/* Card with CTA */}
                    <div
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        borderBottomLeftRadius: '18px',
                        borderBottomRightRadius: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        marginTop: '-4px',
                        width: '344px',
                      }}
                    >
                      <div style={{ width: '344px' }}>
                        {/* Headline */}
                        <div
                          style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            lineHeight: '22px',
                            marginLeft: '16px',
                            marginRight: '16px',
                            marginTop: '12px',
                            maxHeight: '22px',
                            overflow: 'hidden',
                            WebkitLineClamp: 1,
                          }}
                        >
                          {truncateText(adData.headline, 30)}
                        </div>

                        {/* Description */}
                        <div
                          style={{
                            color: 'rgba(0, 0, 0, 0.5)',
                            fontSize: '16px',
                            lineHeight: '20px',
                            marginLeft: '16px',
                            marginRight: '16px',
                            marginTop: '4px',
                            maxHeight: '20px',
                            overflow: 'hidden',
                            WebkitLineClamp: 1,
                          }}
                        >
                          {truncateText(adData.description, 40)}
                        </div>

                        {/* Display Link */}
                        <div
                          style={{
                            color: 'rgba(0, 0, 0, 0.5)',
                            fontSize: '16px',
                            lineHeight: '20px',
                            marginLeft: '16px',
                            marginRight: '16px',
                            maxHeight: '20px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            WebkitLineClamp: 1,
                          }}
                        >
                          {adData.displayLink}
                        </div>
                      </div>

                      {/* CTA Button */}
                      <div
                        style={{
                          backgroundColor: 'rgb(10, 124, 255)',
                          borderRadius: '12px',
                          margin: '12px',
                          padding: '8px',
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            color: 'rgb(255, 255, 255)',
                            height: '20px',
                            lineHeight: '20px',
                          }}
                        >
                          {adData.callToAction}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom divider */}
              <div
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  height: '2px',
                  width: '376px',
                }}
              />
            </div>
          )}
      </div>
    </div>
  );
};
