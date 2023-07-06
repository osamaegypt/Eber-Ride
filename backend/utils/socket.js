const express = require('express')
const  socketio  = require('socket.io');
const { mongoose } = require('mongoose')
const driverModel = require('../models/driver')
const createrideModel = require("../models/createride")

async function initializeSocket(server) {
    const io = socketio(server, {cors: {origin: ["http://localhost:4200"]}});

    io.on("connection", (socket) => {
        console.log("Socket is Working........");




    // --------------------------------------------------------UPDATE DRIVER STATUS--------------------------------------------------------//
    socket.on('driverstatus', async (data) => {
        const { driverId, status } = data;
        
        // console.log(data)

        try {
            const data = await driverModel.findByIdAndUpdate(driverId, { status },  {new: true});
            io.emit('statusdata', { success: true, data, message: 'Driver Status Updated Successfully.' });
        } 
        catch (error) {
            io.emit('statusdata', { success: false, message: error });
          }
        });

    // --------------------------------------------------------UPDATE DRIVER SERVICE TYPE--------------------------------------------------------//
    socket.on('driverService', async (data) => {
        const { driverId, servicetype } = data;
            console.log(data);

        try {
            const existingService = await driverModel.findByIdAndUpdate(driverId, { servicetype },  {new: true});
            io.emit('servicedata', { success: true, message: 'Service Updated Successfully', existingService });
        } 
        catch (error) {
            io.emit('servicedata', { success: false, message: error });
          }
        });



    // ------------------------------------------------DRIVERS OF PARTICULAR CITY AND SERVICE ,STATUS TRUE------------------------------------//
    socket.on('assigneddriverdata', async (data) => {
        // console.log(data , "===========bodydata");

    try {
      const cityId = new mongoose.Types.ObjectId(data.cityId);
      const serviceId = new mongoose.Types.ObjectId(data.serviceId);

      const aggregationPipeline = [
        {
          $lookup: {
            from: 'citymodels',
            localField: 'city',
            foreignField: '_id',
            as: 'cityDetails'
          }
        },
        {
          $unwind: "$cityDetails"
        },
        {
          $lookup: {
            from: 'vehiclemodels',
            localField: 'servicetype',
            foreignField: '_id',
            as: 'serviceDetails'
          }
        },
        {
          $unwind: "$serviceDetails"
        },
        {
          $match: {
              city: cityId,
              servicetype: serviceId,
              status: true,
              assign: "0"
            },
        },
  
      ];
      const driverdata = await driverModel.aggregate(aggregationPipeline).exec()
      // console.log(driverdata , "============ response data");
      io.emit('driverdata', driverdata , {success: true, message: "Driver Assigned Successfully"});
      
    } catch (error) {
        console.log(error);
        io.emit('driverdata', { success: false, message: error });
    }
  })

  // ------------------------------------------------SHOW DRIVER DATA AFTER ASSIGN-----------------------------------------------//
  socket.on("afterassigneddriver", async(data) => {
    const rideId = data.rideId
    const driverId = data.driverId
    console.log("This is afterassigneddriver Data===========",data);
    console.log("Driver ID:",driverId,"RIDE ID:",rideId);

    
    try {
      const driver =  await driverModel.findByIdAndUpdate(driverId, { assign: "1" }, { new: true });
      await driver.save();
      console.log(driver); 
      const ride = await  createrideModel.findByIdAndUpdate(rideId, {driverId: driverId}, { new: true })
     

      console.log(ride);

      io.emit('driverdata', { success: true, driver, message: 'Driver Assigned Successfully.' });
      io.emit('driverdata', { success: true, ride, message: 'Driver Assigned Successfully.' });
      
    } catch (error) {
        console.log(error);
        io.emit('driverdata', { success: false, message: error });
    }
  })



    socket.on("disconnect", () => {
        console.log("client Disconnected");
    });
    });



};



module.exports = initializeSocket;



// socket.on('assigndriver' , async(data)=>{
//   console.log(data);
//   const _id = data._id;
//   const driver_id = data.driver_id;
//   try{
//     const driver = await driverModel.findByIdAndUpdate(driver_id, { assign: "1" }, { new: true });
//     await driver.save();
//     console.log(driver); 
//     const ride = await createrideModel.findByIdAndUpdate(_id, {driver_id : driver_id}, { new: true })
//     await ride.save()
//     console.log(ride);
//     io.emit('assigndriver', { driver });
//     io.emit('assigndriver', { ride });
//   }catch(error) {
//     console.log(error);
//     socket.emit('assigndriver', { success: false })
//   }
  

// })