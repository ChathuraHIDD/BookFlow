package com.bookflow.backend;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

import com.bookflow.backend.auth.model.UserRole;

class BackendApplicationTests {

	@Test
	void roleParsingSupportsStaffMemberFormat() {
		assertEquals(UserRole.STAFF_MEMBER, UserRole.fromValue("staff member"));
	}

}
