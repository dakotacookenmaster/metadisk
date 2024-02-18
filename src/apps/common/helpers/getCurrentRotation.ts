export default function getCurrentRotation(el: HTMLElement){
    var st = window.getComputedStyle(el, null);
    var tm = st.getPropertyValue("-webkit-transform") ||
             st.getPropertyValue("-moz-transform") ||
             st.getPropertyValue("-ms-transform") ||
             st.getPropertyValue("-o-transform") ||
             st.getPropertyValue("transform") ||
             "none";
    if (tm != "none") {
      var values = tm.split('(')[1].split(')')[0].split(',');
      /*
      a = values[0];
      b = values[1];
      angle = Math.round(Math.atan2(b,a) * (180/Math.PI));
      */
      //return Math.round(Math.atan2(values[1],values[0]) * (180/Math.PI)); //this would return negative values the OP doesn't wants so it got commented and the next lines of code added
      var angle = Math.round(Math.atan2(+values[1], +values[0]) * (180/Math.PI));
      return (angle < 0 ? angle + 360 : angle); //adding 360 degrees here when angle < 0 is equivalent to adding (2 * Math.PI) radians before
    }
    return 0;
  }