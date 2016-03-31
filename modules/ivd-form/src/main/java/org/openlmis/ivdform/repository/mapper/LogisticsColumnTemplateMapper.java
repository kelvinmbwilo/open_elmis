/*
 * Electronic Logistics Management Information System (eLMIS) is a supply chain management system for health commodities in a developing country setting.
 *
 * Copyright (C) 2015  John Snow, Inc (JSI). This program was produced for the U.S. Agency for International Development (USAID). It was prepared under the USAID | DELIVER PROJECT, Task Order 4.
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

package org.openlmis.ivdform.repository.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;
import org.openlmis.ivdform.domain.reports.LogisticsColumn;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LogisticsColumnTemplateMapper {

  @Select("select id as masterColumnId, * from vaccine_logistics_master_columns")
  List<LogisticsColumn> getAllMasterColumns();


  @Select("select v.*, c.indicator, c.mandatory, c.description, c.name from vaccine_program_logistics_columns v " +
      "           join vaccine_logistics_master_columns c " +
      "               on c.id = v.masterColumnId " +
      "         where v.programId = #{programId} " +
      "         order by v.displayOrder")
  List<LogisticsColumn> getForProgram(@Param("programId") Long programId);


  @Insert("INSERT INTO vaccine_program_logistics_columns (programId, masterColumnId, label, displayOrder, visible, createdBy) " +
      " values (#{programId}, #{masterColumnId}, #{label}, #{displayOrder}, #{visible}, #{createdBy})")
  void insertProgramColumn(LogisticsColumn column);

  @Update("UPDATE vaccine_program_logistics_columns SET " +
      " programId = #{programId}," +
      " masterColumnId = #{masterColumnId}, " +
      " label = #{label}, " +
      " displayOrder = #{displayOrder}, " +
      " visible = #{visible}," +
      " modifiedBy = #{modifiedBy}" +
      " WHERE id = #{id} ")
  void updateProgramColumn(LogisticsColumn column);
}
