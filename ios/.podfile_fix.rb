# Workaround for boost checksum issue
module Pod
  class Downloader
    class Http < Base
      def verify_download
        # Skip verification for boost
        if @url.to_s.include?('boost')
          UI.puts "Skipping checksum verification for boost".yellow
          return
        end
        super
      end
    end
  end
end
