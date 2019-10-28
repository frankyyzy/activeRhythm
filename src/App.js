import React, { Component } from "react";
import "./App.css";
import Hitbar from "./components/hitbar";
import soundfile from "./media/AYue.mp3";
import { A5DeviceManager, A5Device } from 'activ5-device';

var mySampleRate = 9600;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      force: 0, // force in percentaage
      audioBuffer: null,
      height: 500,
      width: 1000,
      score: 0,
      actualforce: 0
    };
  }
  receiveData(){
    
    var self = this;
    setInterval(() => {
      if (self.device){
        self.device.getIsometricData().subscribe((data) => {

          this.state.actualforce = data;
          // this.setState({
          //         force: data 
          // });
          // if (data > 5){
          //   if (this.state.force != 80){
          //     this.setState({
          //       force: 80
          //     })
          //   }
            
          // } else {
          //   if (this.state.force != 20){
          //     this.setState({
          //       force: 20
          //     })
          //   }
            
          // }
          
        });
      }
      
    }, 500); 

  }

  componentDidMount() {
    document.getElementById("misstag").style.display = "none";

    new A5DeviceManager().connect().then((newDevice) => {
      this.device = newDevice;
      setTimeout(() => {
        
          newDevice.startIsometric();
      }, 1000);
      this.receiveData();
   

    });
    this.waveCanvans.height = this.state.height;
    this.waveCanvans.width = this.state.width;

    // this.drawLine(this.map(0,0), this.map(1,1));
    

  }

  prepare() {
    var buffer = this.state.audioBuffer;
    
    
    var offlineContext = new OfflineAudioContext(1, buffer.length, mySampleRate);
    var source = offlineContext.createBufferSource();
    source.buffer = buffer;
    var filter = offlineContext.createBiquadFilter();
    filter.type = "lowshelf";
    source.connect(filter);
    filter.connect(offlineContext.destination);
    source.start(0);
    offlineContext.startRendering();

    var self = this;
    offlineContext.oncomplete = function(e) {
      self.processbuffer(e)
    };
  }

  arrayMin(arr) {
    var len = arr.length,
      min = Infinity;
    while (len--) {
      if (arr[len] < min) {
        min = arr[len];
      }
    }
    return min;
  }
  
  arrayMax(arr) {
    var len = arr.length,
      max = -Infinity;
    while (len--) {
      if (arr[len] > max) {
        max = arr[len];
      }
    }
    return max;
  }

  processbuffer(e){

    var filteredBuffer = e.renderedBuffer;

    var data = filteredBuffer.getChannelData(0);
    //If you want to analyze both channels, use the other channel later

    var min = this.arrayMin(data);
    var max = this.arrayMax(data);
    var threshold1 = min + (max - min) * 0.65;
    var threshold2 = min + (max - min) * 0.53;
    // var peaks = getPeaksAtThreshold(data, threshold);
    // var intervalCounts = countIntervalsBetweenNearbyPeaks(peaks);
  

    var peaksArray = [];
    var length = data.length;
    var skiplength = 60/90 * mySampleRate;
    console.log(data.length)
    for (var i = 0; i < length;i++) {
      if (data[i] > threshold1) {
        peaksArray.push(1);
        for (let increment = 0; increment < skiplength; increment ++){
          peaksArray.push(0.8);
        }
        // Skip forward ~ 1/4s to get past this peak.
        i += skiplength;
        continue;
      } else if (data[i] > threshold2){
        peaksArray.push(0.5);
        for (let increment = 0; increment < skiplength; increment ++){
          peaksArray.push(0.5);
        }
        // Skip forward ~ 1/4s to get past this peak.
        i += skiplength;
        continue;
      } else {
        peaksArray.push(0.2);
        for (let increment = 0; increment < skiplength; increment ++){
          peaksArray.push(0.2);
        }
        // Skip forward ~ 1/4s to get past this peak.
        i += skiplength;
        continue;
      }
      
    }

  
    this.state.audioBuffer = peaksArray;


    var song = document.getElementById("music");
    
    this.start();
    song.play();
  }

  start(){
    console.log(this.state.audioBuffer)
    var timeOnScreen = 20; //5seconds on screen
    var bars = 1000; //number of bars
    var start = 0;
    var end = timeOnScreen * mySampleRate;
    var refreshtime = 10;
    var offset = (this.state.width / bars) * 2;
    setInterval(() => {
      const context = this.waveCanvans.getContext('2d');
      context.clearRect(0, 0, this.state.width, this.state.height);

      for (var i=start; i < end; i+= mySampleRate * timeOnScreen / bars){

        let startPoint = this.map((i-start) / (end - start), this.state.audioBuffer[i]);
        let endPoint = this.map((i + 1 -start) / (end - start) , this.state.audioBuffer[i + 1]);
   
        context.fillRect(startPoint.x, startPoint.y, offset, this.state.height);

        
        // this.drawLine(this.Point(startPoint.x, startPoint.y), this.Point(startPoint.x + offset, startPoint.y) );
        // this.drawLine(this.Point(startPoint.x, startPoint.y), this.Point(startPoint.x, this.state.height) );
        // this.drawLine(this.Point(startPoint.x + offset, startPoint.y), this.Point(startPoint.x + offset, this.state.height) );
      }
      if (Math.abs(this.state.audioBuffer[start] * 100 - this.state.actualforce) < 40){
        // console.log("here")
        this.setState({
          force: this.state.audioBuffer[start] * 100,
          
        })
        if (this.state.audioBuffer[start] != 0.2){
          this.setState({

            score: this.state.score + 1
          })
        }

        document.getElementsByTagName("body")[0].style.backgroundColor="white"
        document.getElementById("bg").style.backgroundColor="white";
        document.getElementById("misstag").style.display = "none";
        // document.getElementsByTagName("body")[0].style.backgroundColor="#7CFC00";
        // document.getElementById("bg").style.backgroundColor="#7CFC00";
      } else {
        this.setState({
          force: this.state.actualforce
        })


        document.getElementsByTagName("body")[0].style.backgroundColor="red"
        document.getElementById("bg").style.backgroundColor="red";
        document.getElementById("misstag").style.display = "block";
      }



      start += refreshtime * mySampleRate / 1000;
      end += refreshtime * mySampleRate / 1000;


    }, refreshtime);
  }

  map(x,y){
    return this.Point(x * this.state.width,-y * this.state.height + this.state.height);
  }

  Point(x,y){
    return {x: x, y: y}
  }

  drawLine(start,end){
    const ctx = this.waveCanvans.getContext("2d");
    ctx.beginPath()
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.closePath();
  }

  openfile(event) {
    var input = event.target;
    var audioContext = new AudioContext({sampleRate:mySampleRate});

    var reader = new FileReader();
   
    var self = this;
    reader.onload = function() {
      var arrayBuffer = reader.result;
      audioContext.decodeAudioData(arrayBuffer,  function decodedDone(decoded) {
        var audioBuffer = new Float32Array(decoded.length);
    
        audioBuffer = decoded.getChannelData(0);
        self.setState({
          audioBuffer: decoded
        })
        self.prepare();
      
      });
    };
    reader.readAsArrayBuffer(input.files[0]);
    
  }

 

  render() {
    return (
      <div className="App" id="bg">
        <div className="headerBar">
          <h1>Score: {this.state.score}</h1>
          <div>

          <audio ref="audio_tag" id="music" src={soundfile} controls>
            {/* <source src="./media/AYue.mp3" type="audio/mp3"/> */}
          </audio>

          <input type="file" onChange={this.openfile.bind(this)}></input>

          

          </div>
          <h1 id="misstag">MISS!</h1>
        </div>

        <div className="mainViewPanel">
          <Hitbar force={this.state.force}></Hitbar>
          <canvas
            ref={waveCanvans => (this.waveCanvans = waveCanvans)}
          ></canvas>
        </div>
      </div>
    );
  }
}

export default App;
