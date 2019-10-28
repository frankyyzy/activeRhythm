import React, {Component} from "react";
import ReactDOM from "react-dom";
import "../styles/hitbar.css";


class Hitbar extends Component {
    constructor(props){
        super(props);
        
    }

  render() {
    return (
    <div>
        <div className = "wrapper">
            <div className="filler" style ={{height: this.props.force+ "%"}}/>
        </div>
       
        
    </div>);
  }
}


export default Hitbar;
