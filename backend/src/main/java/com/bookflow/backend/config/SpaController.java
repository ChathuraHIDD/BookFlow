package com.bookflow.backend.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    @RequestMapping(value = {
        "/",
        "/login",
        "/dashboard",
        "/admin/**",
        "/student/**",
        "/technician/**",
        "/kuppi-sessions",
        "/software-hub",
        "/group-chat",
        "/ai-notes",
        "/verify/booking/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
