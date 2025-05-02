import React, { useState } from 'react';
import NavbarAdmin from './taxi/NavbarAdmin';
import DashboardAdmin from './taxi/DashboardAdmin';
import { Route, Routes } from "react-router-dom";
import Statistiques from './taxi/Statistiques';
import ClientsAdmin from './taxi/CientsAdmin';
import ChauffeursAdmin from './taxi/ChauffeursAdmin';
function App() {
 return(
  <div>
    <NavbarAdmin />
    <Routes>
      <Route element={<NavbarAdmin/>}/>
      <Route path='/dashboard' element = {<DashboardAdmin />} />
      <Route path='/statistics' element = {<Statistiques />} />
      <Route path='/clients' element = {<ClientsAdmin />} />
      <Route path='/chauffeurs' element = {<ChauffeursAdmin  />} />
    </Routes>
  </div>
 )
}

export default App;