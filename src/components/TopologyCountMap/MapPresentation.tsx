import React from 'react';
import { Feature, Geometry, GeoJsonProperties } from "geojson";
import { ScaleSequential, GeoPath } from "d3";
import { useSpring, animated } from 'react-spring';
import styled from 'styled-components';
import { LegendPresentation } from './LegendPresentation';

interface IMapPresentationProps {
    width: number;
    height: number;
    mapData?: Array<Feature<Geometry, GeoJsonProperties>>;
    areaCounts?: Map<string, number>;
    zoomToCountryId?: string;
    colourScale: ScaleSequential<string>;
    geoPath: GeoPath;
}

const StyledPath = styled.path`
  &:hover {
    stroke: #888888;
  }
`;

const StyledContainer = styled.div`
  border: solid 1px #ddd;
`;

const defaultValues = {
    mapData: new Array<Feature<Geometry, GeoJsonProperties>>(),
    areaCounts: new Map<string, number>()
};

export const MapPresentation: React.FunctionComponent<IMapPresentationProps> = (props) => {

    const { width, height, mapData, areaCounts, zoomToCountryId, colourScale, geoPath } = { ...defaultValues, ...props };

    let translateX = 0;
    let translateY = 0;
    let scale = 1;
    let strokeWidth = 0.5;

    if(zoomToCountryId) {
      // get a specific country
      const country = mapData.filter(item => item.id === zoomToCountryId);

      if(country.length > 0) {
        const bounds = geoPath.bounds(country[0]);
        const dx = bounds[1][0] - bounds[0][0];
        const dy = bounds[1][1] - bounds[0][1];
        const x = (bounds[0][0] + bounds[1][0]) / 2;
        const y = (bounds[0][1] + bounds[1][1]) / 2;
  
        scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)));
        translateX = width / 2 - scale * x;
        translateY = height / 2 - scale * y;
        strokeWidth = 0.5 / scale;
      }
    }

    const svgAnimation = useSpring({ width: width, height: height, viewBox: `0 0 ${width} ${height}`, transform: `translate(${translateX}, ${translateY}) scale(${scale})`});

    /*
      NOTE: There is a bug in react-spring https://github.com/react-spring/react-spring/issues/641

      This means we can't animate the viewbox until v9.0 of react-spring but the effect is still usable
    */
    return (
        <StyledContainer>
            {mapData && (
              <animated.svg width={ svgAnimation.width } height={ svgAnimation.height } viewBox={`0 0 ${width} ${height}`}>
                <animated.g className="paths" transform={svgAnimation.transform}>
                  {
                    mapData.map((d,i) => (
                        <StyledPath
                          key={ `path-${ i }` }
                          d={ geoPath(d) as string }
                          className="country"
                          fill={ areaCounts.has(d.id as string) ? colourScale(areaCounts.get(d.id as string) as number) : colourScale(0) }
                          stroke={ zoomToCountryId && zoomToCountryId === d.id ? "#000000" : "#BBBBBB"}
                          strokeWidth={ zoomToCountryId && zoomToCountryId === d.id ? strokeWidth * 2 : strokeWidth }
                        />
                      )
                    )
                  }
                </animated.g>
                {areaCounts && areaCounts.size && 
                  <g transform={`translate(10, ${(height - (height / 3)) - 20})`}>
                    <LegendPresentation colourScale={colourScale} barHeight={height / 3}></LegendPresentation>
                  </g>
                }
                
              </animated.svg>
            )}
          </StyledContainer>
      )
}