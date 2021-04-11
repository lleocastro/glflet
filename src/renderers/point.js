'use strict';

const { getImageObj, makeTexture, formatXYPoint } = require('../utils');

module.exports = async (params, { gl, program }) => {
  const matrixLocation = gl.getUniformLocation(program, 'u_matrix');
  const textureLocation = gl.getUniformLocation(program, 'u_texture');
  const vertLoc = gl.getAttribLocation(program, 'a_vertex');
  const pointSizeLocation = gl.getAttribLocation(program, 'a_point_size');

  let verts = [];
  const lookups = [];

  params.data.forEach((ld, i) => {
    const pixel = leafletMap.project(new L.LatLng(ld[0], ld[1]), 0);

    verts.push(pixel.x, pixel.y);
    lookups.push({ index: i, ...formatXYPoint(ld[0], ld[1]) });
  });

  const numPoints = params.data.length;

  const vertArray = new Float32Array(verts);
  const fsize = vertArray.BYTES_PER_ELEMENT;

  // free memory
  verts = [];
  // ----------

  const vertBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.STATIC_DRAW);
  gl.vertexAttribPointer(vertLoc, 2, gl.FLOAT, false, fsize*2, 0);
  gl.enableVertexAttribArray(vertLoc);

  makeTexture(gl, textureLocation, await getImageObj(params.icon), 0);

  return {
    draw: (map, mapMatrix) => draw(gl, matrixLocation, pointSizeLocation, map, mapMatrix, numPoints),
    onClick: (map, callback) => onClick(map, lookups, callback),
  };
};

function draw(gl, matrixLocation, pointSizeLocation, map, mapMatrix, count) {
  gl.vertexAttrib1f(pointSizeLocation, Math.max(map.getZoom() + 5.0, 1.0));

  // attach matrix value to uniform in shader
  gl.uniformMatrix4fv(matrixLocation, false, mapMatrix);

  gl.drawArrays(gl.POINTS, 0, count);
}

function onClick(map, lookups, callback) {
  map.on('click', (event) => {
    if (callback) {
      const latlng = formatXYPoint(event.latlng.lat, event.latlng.lng);
      const pointer = lookups.find(look => ((look.x === latlng.x) && (look.y === latlng.y)));
      if (pointer) callback(pointer.index);
    }
  });
}
