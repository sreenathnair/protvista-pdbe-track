import * as d3 from "d3";
import _includes from 'lodash-es/includes';
import FeatureShape from './FeatureShape';
import ProtVistaTrack from 'protvista-track';


import ConfigHelper from "./ConfigHelper";

const height = 44,
  width = 760,
  padding = {
    top: 2,
    right: 10,
    bottom: 2,
    left: 10
  };

class PDBeTrack extends ProtVistaTrack {
  constructor() {
    super();
  
  }
 

  connectedCallback() {

    super.connectedCallback();
    
  }
  
  set data(data) {

    //this._data = data; //comment out to take care of text labeling
    this._data = super.normalizeLocations(data); 
    super._createTrack();
  }

  static get observedAttributes() {
    return [
      'length', 'displaystart', 'displayend', 'highlightstart', 'highlightend', 'color', 'shape', 'layout'
    ];
  }

  attributeChangedCallback(name, oldValue, newValue) {

    super.attributeChangedCallback(name, oldValue, newValue);
    
  }


  _createTrack() {
    this._layoutObj.init(this._data);

    this._xScale = d3.scaleLinear()
      .range([padding.left, width - padding.right])
      .domain([this._displaystart, this._displayend]);

    d3.select(this).selectAll('*').remove();
    d3.select(this).html('');

    this.svg = d3.select(this)
      .append('div')
      .append('svg')
      .attr('width', width)
      .attr('height', (height));

    this.highlighted = this.svg.append('rect')
      .attr('class', 'highlighted')
      .attr('fill', 'yellow')
      // .attr('stroke', 'black')
      .attr('height', height);

    this.seq_g = this.svg.append('g')
      .attr('class', 'sequence-features');

    let sequenceComp = document.querySelector('protvista-sequence'); // get sequence string from sequence component
    
    if(sequenceComp != undefined) {
      this.sequence = sequenceComp.data;
    }

    this._createFeatures();
    this._updateTrack();
  }

  _createFeatures() {

    // Define the div for the tooltip
    this.toolTipDiv = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    this.featuresG = this.seq_g.selectAll('g.feature-group')
      .data(this._data);


    //console.log(this._data)

    this.locations = this.featuresG.enter()
      .append('g')
      .attr('class', 'feature-group')
      .attr('id', d => `g_${d.accession}`)
      .selectAll('g.location-group')
      .data(d => d.locations.map(({ ...l }) => ({ feature: d, ...l })))
      .enter().append('g')
      .attr('class', 'location-group');

    this.features = this.locations
      .selectAll('g.fragment-group')
      .data(d => d.fragments.map(({ ...l }) => ({ feature: d.feature, ...l })))
      .enter()
      .append('path')
      .attr('class', 'feature')
      .attr('d', f =>
        this._featureShape.getFeatureShape(
          this._xScale(2) - this._xScale(1), this._layoutObj.getFeatureHeight(f),
          f.end ? f.end - f.start + 1 : 1, this._getShape(f.feature)
        )
      )
      .attr('transform', f =>
        'translate(' + this._xScale(f.start) + ',' + (padding.top + this._layoutObj.getFeatureYPos(f.feature)) + ')'
      )
      .attr('fill', f => this._getFeatureColor(f.feature))
      .attr('stroke', f => this._getFeatureColor(f.feature))
      .on('mouseover', f => {

        /*
        // invoking tool tip
        this.toolTipDiv.transition()
          .duration(100)
          .style("opacity", .9);
        this.toolTipDiv.html(f.toolTip)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY + 30) + "px"); */

        // disable highlight
        /*this.dispatchEvent(new CustomEvent("change", {
          detail: { highlightend: f.end, highlightstart: f.start }, bubbles: true, cancelable: true
        }));*/
      })
      .on('mouseout', () => {

        // removing tooltip
        this.toolTipDiv.transition()
          .duration(300)
          .style("opacity", 0);

        this.dispatchEvent(new CustomEvent("change", {
          detail: { highlightend: null, highlightstart: null }, bubbles: true, cancelable: true
        }));
      })
      .on('mousemove', f => {
        
        // get linear scale to find the exact residue on mouse over and invoke tool tip
        let residueScale = d3.scaleLinear()
          .domain([0, width])
          .range([this._displaystart, this._displayend]);

        let residueNumber = Math.round(residueScale(d3.event.pageX - this.getBoundingClientRect().left));
        let toolTipData = this._parseToolTip(f.toolTip, residueNumber);

        
        // invoking tool tip
        this.toolTipDiv.transition()
          .duration(100)
          .style("opacity", .9);
        this.toolTipDiv.html(toolTipData)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY + 30) + "px");
          
      });

    
  }


  _parseToolTip(toolTip, resNum) {

    return toolTip.replace(/{resNum}/g, resNum)
                  .replace(/{charAtResNum}/g, this.sequence.charAt(resNum - 1));

  }
}


export default PDBeTrack;
